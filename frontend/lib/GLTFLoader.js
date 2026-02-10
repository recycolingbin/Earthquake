// GLTFLoader for Three.js r152 - non-module version
// Adapted from three.js examples

(function () {
	if (typeof THREE === 'undefined') {
		console.warn('THREE not found for GLTFLoader');
		return;
	}

	class GLTFLoader {
		constructor(manager) {
			this.manager = manager !== undefined ? manager : THREE.DefaultLoadingManager;
			this.dracoLoader = null;
			this.ktx2Loader = null;
			this.meshoptDecoder = null;
			this.path = '';
			this.resourcePath = '';
			this.crossOrigin = 'anonymous';
			this.requestHeader = {};
		}

		setPath(value) {
			this.path = value;
			return this;
		}

		setResourcePath(value) {
			this.resourcePath = value;
			return this;
		}

		setCrossOrigin(value) {
			this.crossOrigin = value;
			return this;
		}

		setDRACOLoader(dracoLoader) {
			this.dracoLoader = dracoLoader;
			return this;
		}

		load(url, onLoad, onProgress, onError) {
			const scope = this;
			const path = this.path === '' ? THREE.LoaderUtils.extractUrlBase(url) : this.path;

			const loader = new THREE.FileLoader(this.manager);
			loader.setPath(this.path);
			loader.setResponseType('arraybuffer');
			loader.setRequestHeader(this.requestHeader);

			loader.load(url, function (data) {
				try {
					scope.parse(data, path, function (gltf) {
						onLoad(gltf);
					}, onError);
				} catch (e) {
					if (onError) {
						onError(e);
					} else {
						console.error(e);
					}
					scope.manager.itemError(url);
				}
			}, onProgress, onError);
		}

		parse(data, path, onLoad, onError) {
			let json;
			const extensions = {};
			
			if (typeof data === 'string') {
				json = JSON.parse(data);
			} else {
				const magic = THREE.LoaderUtils.decodeText(new Uint8Array(data, 0, 4));
				if (magic === 'glTF') {
					// Binary glTF
					const view = new DataView(data);
					const version = view.getUint32(4, true);
					if (version !== 2) {
						if (onError) onError(new Error('Unsupported glTF version: ' + version));
						return;
					}
					const length = view.getUint32(8, true);
					const chunkLength = view.getUint32(12, true);
					const chunkType = view.getUint32(16, true);
					if (chunkType !== 0x4E4F534A) { // JSON
						if (onError) onError(new Error('Expected JSON chunk'));
						return;
					}
					const jsonText = THREE.LoaderUtils.decodeText(new Uint8Array(data, 20, chunkLength));
					json = JSON.parse(jsonText);
					
					// Check for binary chunk
					if (length > 20 + chunkLength) {
						const binChunkLength = view.getUint32(20 + chunkLength, true);
						const binChunkType = view.getUint32(24 + chunkLength, true);
						if (binChunkType === 0x004E4942) { // BIN
							extensions.binaryChunk = new Uint8Array(data, 28 + chunkLength, binChunkLength);
						}
					}
				} else {
					const jsonText = THREE.LoaderUtils.decodeText(new Uint8Array(data));
					json = JSON.parse(jsonText);
				}
			}

			if (!json.asset || json.asset.version[0] < 2) {
				if (onError) onError(new Error('Unsupported asset version: ' + (json.asset ? json.asset.version : 'unknown')));
				return;
			}

			const parser = new GLTFParser(json, {
				path: path || this.resourcePath || '',
				crossOrigin: this.crossOrigin,
				requestHeader: this.requestHeader,
				manager: this.manager,
				extensions: extensions
			});

			parser.parse(onLoad, onError);
		}
	}

	class GLTFParser {
		constructor(json, options) {
			this.json = json;
			this.options = options;
			this.cache = new Map();
			this.associations = new Map();
			this.primitiveCache = {};
		}

		parse(onLoad, onError) {
			const json = this.json;
			const parser = this;

			// Load all buffers first
			this.loadBuffers().then(() => {
				return Promise.all([
					parser.loadMaterials(),
					parser.loadMeshes()
				]);
			}).then(() => {
				return parser.loadScene(json.scene || 0);
			}).then((scene) => {
				onLoad({
					scene: scene,
					scenes: [scene],
					animations: [],
					cameras: [],
					asset: json.asset
				});
			}).catch(onError);
		}

		loadBuffers() {
			const json = this.json;
			const options = this.options;
			
			if (!json.buffers) return Promise.resolve([]);
			
			return Promise.all(json.buffers.map((buffer, index) => {
				if (buffer.uri === undefined) {
					// Embedded binary
					if (options.extensions && options.extensions.binaryChunk) {
						this.cache.set('buffer:' + index, options.extensions.binaryChunk.buffer);
						return Promise.resolve();
					}
					return Promise.reject(new Error('Missing buffer URI'));
				}
				
				if (buffer.uri.startsWith('data:')) {
					// Data URI
					const base64 = buffer.uri.split(',')[1];
					const binary = atob(base64);
					const bytes = new Uint8Array(binary.length);
					for (let i = 0; i < binary.length; i++) {
						bytes[i] = binary.charCodeAt(i);
					}
					this.cache.set('buffer:' + index, bytes.buffer);
					return Promise.resolve();
				}
				
				// External file
				return new Promise((resolve, reject) => {
					const loader = new THREE.FileLoader(options.manager);
					loader.setResponseType('arraybuffer');
					loader.load(options.path + buffer.uri, (data) => {
						this.cache.set('buffer:' + index, data);
						resolve();
					}, undefined, reject);
				});
			}));
		}

		loadMaterials() {
			const json = this.json;
			if (!json.materials) return Promise.resolve([]);
			
			const materials = json.materials.map((materialDef, index) => {
				const material = new THREE.MeshStandardMaterial();
				material.name = materialDef.name || '';
				
				if (materialDef.pbrMetallicRoughness) {
					const pbr = materialDef.pbrMetallicRoughness;
					if (pbr.baseColorFactor) {
						material.color.fromArray(pbr.baseColorFactor);
						if (pbr.baseColorFactor[3] !== undefined) {
							material.opacity = pbr.baseColorFactor[3];
						}
					}
					if (pbr.metallicFactor !== undefined) material.metalness = pbr.metallicFactor;
					if (pbr.roughnessFactor !== undefined) material.roughness = pbr.roughnessFactor;
				}
				
				if (materialDef.doubleSided) material.side = THREE.DoubleSide;
				if (materialDef.alphaMode === 'BLEND') material.transparent = true;
				
				this.cache.set('material:' + index, material);
				return material;
			});
			
			return Promise.resolve(materials);
		}

		loadMeshes() {
			const json = this.json;
			if (!json.meshes) return Promise.resolve([]);
			
			return Promise.all(json.meshes.map((meshDef, meshIndex) => {
				return this.loadMesh(meshIndex);
			}));
		}

		loadMesh(meshIndex) {
			const json = this.json;
			const meshDef = json.meshes[meshIndex];
			
			const primitives = meshDef.primitives.map((primitiveDef) => {
				return this.loadPrimitive(primitiveDef);
			});
			
			return Promise.all(primitives).then((geometries) => {
				const group = geometries.length > 1 ? new THREE.Group() : null;
				
				geometries.forEach((geometry, i) => {
					const primitiveDef = meshDef.primitives[i];
					let material;
					
					if (primitiveDef.material !== undefined) {
						material = this.cache.get('material:' + primitiveDef.material);
					}
					if (!material) {
						material = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.1, roughness: 0.85 });
					}
					
					const mesh = new THREE.Mesh(geometry, material);
					if (group) {
						group.add(mesh);
					} else {
						this.cache.set('mesh:' + meshIndex, mesh);
					}
				});
				
				if (group) {
					this.cache.set('mesh:' + meshIndex, group);
				}
			});
		}

		loadPrimitive(primitiveDef) {
			const attributes = primitiveDef.attributes;
			const geometry = new THREE.BufferGeometry();
			
			const pending = [];
			
			if (attributes.POSITION !== undefined) {
				pending.push(this.loadAccessor(attributes.POSITION).then((accessor) => {
					geometry.setAttribute('position', new THREE.BufferAttribute(accessor.array, accessor.itemSize));
				}));
			}
			
			if (attributes.NORMAL !== undefined) {
				pending.push(this.loadAccessor(attributes.NORMAL).then((accessor) => {
					geometry.setAttribute('normal', new THREE.BufferAttribute(accessor.array, accessor.itemSize));
				}));
			}
			
			if (attributes.TEXCOORD_0 !== undefined) {
				pending.push(this.loadAccessor(attributes.TEXCOORD_0).then((accessor) => {
					geometry.setAttribute('uv', new THREE.BufferAttribute(accessor.array, accessor.itemSize));
				}));
			}
			
			if (primitiveDef.indices !== undefined) {
				pending.push(this.loadAccessor(primitiveDef.indices).then((accessor) => {
					geometry.setIndex(new THREE.BufferAttribute(accessor.array, 1));
				}));
			}
			
			return Promise.all(pending).then(() => {
				if (!geometry.attributes.normal) {
					geometry.computeVertexNormals();
				}
				return geometry;
			});
		}

		loadAccessor(accessorIndex) {
			const json = this.json;
			const accessorDef = json.accessors[accessorIndex];
			const bufferViewDef = json.bufferViews[accessorDef.bufferView];
			
			const bufferData = this.cache.get('buffer:' + bufferViewDef.buffer);
			const byteOffset = (bufferViewDef.byteOffset || 0) + (accessorDef.byteOffset || 0);
			
			const COMPONENT_TYPES = {
				5120: Int8Array,
				5121: Uint8Array,
				5122: Int16Array,
				5123: Uint16Array,
				5125: Uint32Array,
				5126: Float32Array
			};
			
			const TYPE_SIZES = {
				'SCALAR': 1,
				'VEC2': 2,
				'VEC3': 3,
				'VEC4': 4,
				'MAT2': 4,
				'MAT3': 9,
				'MAT4': 16
			};
			
			const TypedArray = COMPONENT_TYPES[accessorDef.componentType];
			const itemSize = TYPE_SIZES[accessorDef.type];
			const count = accessorDef.count;
			
			const array = new TypedArray(bufferData, byteOffset, count * itemSize);
			
			return Promise.resolve({
				array: array,
				itemSize: itemSize,
				count: count
			});
		}

		loadScene(sceneIndex) {
			const json = this.json;
			const sceneDef = json.scenes[sceneIndex];
			const scene = new THREE.Group();
			scene.name = sceneDef.name || '';
			
			if (!sceneDef.nodes) return Promise.resolve(scene);
			
			return Promise.all(sceneDef.nodes.map((nodeIndex) => {
				return this.loadNode(nodeIndex);
			})).then((nodes) => {
				nodes.forEach((node) => scene.add(node));
				return scene;
			});
		}

		loadNode(nodeIndex) {
			const json = this.json;
			const nodeDef = json.nodes[nodeIndex];
			const node = new THREE.Object3D();
			node.name = nodeDef.name || '';
			
			if (nodeDef.matrix) {
				const matrix = new THREE.Matrix4();
				matrix.fromArray(nodeDef.matrix);
				node.applyMatrix4(matrix);
			} else {
				if (nodeDef.translation) node.position.fromArray(nodeDef.translation);
				if (nodeDef.rotation) node.quaternion.fromArray(nodeDef.rotation);
				if (nodeDef.scale) node.scale.fromArray(nodeDef.scale);
			}
			
			const pending = [];
			
			if (nodeDef.mesh !== undefined) {
				const mesh = this.cache.get('mesh:' + nodeDef.mesh);
				if (mesh) {
					node.add(mesh.clone());
				}
			}
			
			if (nodeDef.children) {
				pending.push(Promise.all(nodeDef.children.map((childIndex) => {
					return this.loadNode(childIndex);
				})).then((children) => {
					children.forEach((child) => node.add(child));
				}));
			}
			
			return Promise.all(pending).then(() => node);
		}
	}

	THREE.GLTFLoader = GLTFLoader;
})();
