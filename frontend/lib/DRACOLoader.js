/**
 * THREE.DRACOLoader – Non-module version for global THREE namespace
 * Adapted from three.js r152 (examples/jsm/loaders/DRACOLoader.js)
 */
(function () {

    var _taskCache = new WeakMap();

    class DRACOLoader extends THREE.Loader {

        constructor(manager) {
            super(manager);
            this.decoderPath = '';
            this.decoderConfig = {};
            this.decoderBinary = null;
            this.decoderPending = null;
            this.workerLimit = 4;
            this.workerPool = [];
            this.workerNextTaskID = 1;
            this.workerSourceURL = '';
            this.defaultAttributeIDs = {
                position: 'POSITION',
                normal: 'NORMAL',
                color: 'COLOR',
                uv: 'TEX_COORD'
            };
            this.defaultAttributeTypes = {
                position: 'Float32Array',
                normal: 'Float32Array',
                color: 'Float32Array',
                uv: 'Float32Array'
            };
        }

        setDecoderPath(path) {
            this.decoderPath = path;
            return this;
        }

        setDecoderConfig(config) {
            this.decoderConfig = config;
            return this;
        }

        setWorkerLimit(workerLimit) {
            this.workerLimit = workerLimit;
            return this;
        }

        load(url, onLoad, onProgress, onError) {
            var loader = new THREE.FileLoader(this.manager);
            loader.setPath(this.path);
            loader.setResponseType('arraybuffer');
            loader.setRequestHeader(this.requestHeader);
            loader.setWithCredentials(this.withCredentials);
            var scope = this;
            loader.load(url, function (buffer) {
                scope.parse(buffer, onLoad, onError);
            }, onProgress, onError);
        }

        parse(buffer, onLoad, onError) {
            this.decodeDracoFile(buffer, onLoad, null, null, THREE.SRGBColorSpace).catch(onError);
        }

        decodeDracoFile(buffer, callback, attributeIDs, attributeTypes, vertexColorSpace) {
            if (vertexColorSpace === undefined) vertexColorSpace = THREE.LinearSRGBColorSpace;
            var taskConfig = {
                attributeIDs: attributeIDs || this.defaultAttributeIDs,
                attributeTypes: attributeTypes || this.defaultAttributeTypes,
                useUniqueIDs: !!attributeIDs,
                vertexColorSpace: vertexColorSpace,
            };
            return this.decodeGeometry(buffer, taskConfig).then(callback);
        }

        decodeGeometry(buffer, taskConfig) {
            var taskKey = JSON.stringify(taskConfig);
            if (_taskCache.has(buffer)) {
                var cachedTask = _taskCache.get(buffer);
                if (cachedTask.key === taskKey) {
                    return cachedTask.promise;
                } else if (buffer.byteLength === 0) {
                    throw new Error(
                        'THREE.DRACOLoader: Unable to re-decode a buffer with different ' +
                        'settings. Buffer has already been transferred.'
                    );
                }
            }
            var worker;
            var scope = this;
            var taskID = this.workerNextTaskID++;
            var taskCost = buffer.byteLength;
            var geometryPending = this._getWorker(taskID, taskCost)
                .then(function (_worker) {
                    worker = _worker;
                    return new Promise(function (resolve, reject) {
                        worker._callbacks[taskID] = { resolve: resolve, reject: reject };
                        worker.postMessage({ type: 'decode', id: taskID, taskConfig: taskConfig, buffer: buffer }, [buffer]);
                    });
                })
                .then(function (message) { return scope._createGeometry(message.geometry); });
            geometryPending
                .catch(function () { return true; })
                .then(function () {
                    if (worker && taskID) {
                        scope._releaseTask(worker, taskID);
                    }
                });
            _taskCache.set(buffer, {
                key: taskKey,
                promise: geometryPending
            });
            return geometryPending;
        }

        _createGeometry(geometryData) {
            var geometry = new THREE.BufferGeometry();
            if (geometryData.index) {
                geometry.setIndex(new THREE.BufferAttribute(geometryData.index.array, 1));
            }
            for (var i = 0; i < geometryData.attributes.length; i++) {
                var result = geometryData.attributes[i];
                var name = result.name;
                var array = result.array;
                var itemSize = result.itemSize;
                var attribute = new THREE.BufferAttribute(array, itemSize);
                if (name === 'color') {
                    this._assignVertexColorSpace(attribute, result.vertexColorSpace);
                }
                geometry.setAttribute(name, attribute);
            }
            return geometry;
        }

        _assignVertexColorSpace(attribute, inputColorSpace) {
            if (inputColorSpace !== THREE.SRGBColorSpace) return;
            var _color = new THREE.Color();
            for (var i = 0, il = attribute.count; i < il; i++) {
                _color.fromBufferAttribute(attribute, i).convertSRGBToLinear();
                attribute.setXYZ(i, _color.r, _color.g, _color.b);
            }
        }

        _loadLibrary(url, responseType) {
            var loader = new THREE.FileLoader(this.manager);
            loader.setPath(this.decoderPath);
            loader.setResponseType(responseType);
            loader.setWithCredentials(this.withCredentials);
            return new Promise(function (resolve, reject) {
                loader.load(url, resolve, undefined, reject);
            });
        }

        preload() {
            this._initDecoder();
            return this;
        }

        _initDecoder() {
            if (this.decoderPending) return this.decoderPending;
            var useJS = typeof WebAssembly !== 'object' || this.decoderConfig.type === 'js';
            var librariesPending = [];
            if (useJS) {
                librariesPending.push(this._loadLibrary('draco_decoder.js', 'text'));
            } else {
                librariesPending.push(this._loadLibrary('draco_wasm_wrapper.js', 'text'));
                librariesPending.push(this._loadLibrary('draco_decoder.wasm', 'arraybuffer'));
            }
            var scope = this;
            this.decoderPending = Promise.all(librariesPending)
                .then(function (libraries) {
                    var jsContent = libraries[0];
                    if (!useJS) {
                        scope.decoderConfig.wasmBinary = libraries[1];
                    }
                    var fn = DRACOWorker.toString();
                    var body = [
                        '/* draco decoder */',
                        jsContent,
                        '',
                        '/* worker */',
                        fn.substring(fn.indexOf('{') + 1, fn.lastIndexOf('}'))
                    ].join('\n');
                    scope.workerSourceURL = URL.createObjectURL(new Blob([body]));
                });
            return this.decoderPending;
        }

        _getWorker(taskID, taskCost) {
            var scope = this;
            return this._initDecoder().then(function () {
                if (scope.workerPool.length < scope.workerLimit) {
                    var worker = new Worker(scope.workerSourceURL);
                    worker._callbacks = {};
                    worker._taskCosts = {};
                    worker._taskLoad = 0;
                    worker.postMessage({ type: 'init', decoderConfig: scope.decoderConfig });
                    worker.onmessage = function (e) {
                        var message = e.data;
                        switch (message.type) {
                            case 'decode':
                                worker._callbacks[message.id].resolve(message);
                                break;
                            case 'error':
                                worker._callbacks[message.id].reject(message);
                                break;
                            default:
                                console.error('THREE.DRACOLoader: Unexpected message, "' + message.type + '"');
                        }
                    };
                    scope.workerPool.push(worker);
                } else {
                    scope.workerPool.sort(function (a, b) {
                        return a._taskLoad > b._taskLoad ? -1 : 1;
                    });
                }
                var worker = scope.workerPool[scope.workerPool.length - 1];
                worker._taskCosts[taskID] = taskCost;
                worker._taskLoad += taskCost;
                return worker;
            });
        }

        _releaseTask(worker, taskID) {
            worker._taskLoad -= worker._taskCosts[taskID];
            delete worker._callbacks[taskID];
            delete worker._taskCosts[taskID];
        }

        dispose() {
            for (var i = 0; i < this.workerPool.length; ++i) {
                this.workerPool[i].terminate();
            }
            this.workerPool.length = 0;
            if (this.workerSourceURL !== '') {
                URL.revokeObjectURL(this.workerSourceURL);
            }
            return this;
        }

    }

    /* WEB WORKER */

    function DRACOWorker() {

        var decoderConfig;
        var decoderPending;

        onmessage = function (e) {

            var message = e.data;

            switch (message.type) {

                case 'init':
                    decoderConfig = message.decoderConfig;
                    decoderPending = new Promise(function (resolve) {

                        decoderConfig.onModuleLoaded = function (draco) {

                            resolve({ draco: draco });

                        };

                        DracoDecoderModule(decoderConfig); // eslint-disable-line no-undef

                    });
                    break;

                case 'decode':
                    var buffer = message.buffer;
                    var taskConfig = message.taskConfig;
                    decoderPending.then(function (module) {

                        var draco = module.draco;
                        var decoder = new draco.Decoder();

                        try {

                            var geometry = decodeGeometry(draco, decoder, new Int8Array(buffer), taskConfig);

                            var buffers = geometry.attributes.map(function (attr) { return attr.array.buffer; });

                            if (geometry.index) buffers.push(geometry.index.array.buffer);

                            self.postMessage({ type: 'decode', id: message.id, geometry: geometry }, buffers);

                        } catch (error) {

                            console.error(error);

                            self.postMessage({ type: 'error', id: message.id, error: error.message });

                        } finally {

                            draco.destroy(decoder);

                        }

                    });
                    break;

            }

        };

        function decodeGeometry(draco, decoder, array, taskConfig) {

            var attributeIDs = taskConfig.attributeIDs;
            var attributeTypes = taskConfig.attributeTypes;

            var dracoGeometry;
            var decodingStatus;

            var geometryType = decoder.GetEncodedGeometryType(array);

            if (geometryType === draco.TRIANGULAR_MESH) {

                dracoGeometry = new draco.Mesh();
                decodingStatus = decoder.DecodeArrayToMesh(array, array.byteLength, dracoGeometry);

            } else if (geometryType === draco.POINT_CLOUD) {

                dracoGeometry = new draco.PointCloud();
                decodingStatus = decoder.DecodeArrayToPointCloud(array, array.byteLength, dracoGeometry);

            } else {

                throw new Error('THREE.DRACOLoader: Unexpected geometry type.');

            }

            if (!decodingStatus.ok() || dracoGeometry.ptr === 0) {

                throw new Error('THREE.DRACOLoader: Decoding failed: ' + decodingStatus.error_msg());

            }

            var geometry = { index: null, attributes: [] };

            for (var attributeName in attributeIDs) {

                var attributeType = self[attributeTypes[attributeName]];

                var attribute;
                var attributeID;

                if (taskConfig.useUniqueIDs) {

                    attributeID = attributeIDs[attributeName];
                    attribute = decoder.GetAttributeByUniqueId(dracoGeometry, attributeID);

                } else {

                    attributeID = decoder.GetAttributeId(dracoGeometry, draco[attributeIDs[attributeName]]);

                    if (attributeID === - 1) continue;

                    attribute = decoder.GetAttribute(dracoGeometry, attributeID);

                }

                var attributeResult = decodeAttribute(draco, decoder, dracoGeometry, attributeName, attributeType, attribute);

                if (attributeName === 'color') {

                    attributeResult.vertexColorSpace = taskConfig.vertexColorSpace;

                }

                geometry.attributes.push(attributeResult);

            }

            if (geometryType === draco.TRIANGULAR_MESH) {

                geometry.index = decodeIndex(draco, decoder, dracoGeometry);

            }

            draco.destroy(dracoGeometry);

            return geometry;

        }

        function decodeIndex(draco, decoder, dracoGeometry) {

            var numFaces = dracoGeometry.num_faces();
            var numIndices = numFaces * 3;
            var byteLength = numIndices * 4;

            var ptr = draco._malloc(byteLength);
            decoder.GetTrianglesUInt32Array(dracoGeometry, byteLength, ptr);
            var index = new Uint32Array(draco.HEAPF32.buffer, ptr, numIndices).slice();
            draco._free(ptr);

            return { array: index, itemSize: 1 };

        }

        function decodeAttribute(draco, decoder, dracoGeometry, attributeName, attributeType, attribute) {

            var numComponents = attribute.num_components();
            var numPoints = dracoGeometry.num_points();
            var numValues = numPoints * numComponents;
            var byteLength = numValues * attributeType.BYTES_PER_ELEMENT;
            var dataType = getDracoDataType(draco, attributeType);

            var ptr = draco._malloc(byteLength);
            decoder.GetAttributeDataArrayForAllPoints(dracoGeometry, attribute, dataType, byteLength, ptr);
            var array = new attributeType(draco.HEAPF32.buffer, ptr, numValues).slice();
            draco._free(ptr);

            return {
                name: attributeName,
                array: array,
                itemSize: numComponents
            };

        }

        function getDracoDataType(draco, attributeType) {

            switch (attributeType) {

                case Float32Array: return draco.DT_FLOAT32;
                case Int8Array: return draco.DT_INT8;
                case Int16Array: return draco.DT_INT16;
                case Int32Array: return draco.DT_INT32;
                case Uint8Array: return draco.DT_UINT8;
                case Uint16Array: return draco.DT_UINT16;
                case Uint32Array: return draco.DT_UINT32;

            }

        }

    }

    THREE.DRACOLoader = DRACOLoader;

})();