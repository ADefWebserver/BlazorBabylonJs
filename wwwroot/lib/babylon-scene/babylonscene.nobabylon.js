var babylonscene = (function () {
    'use strict';

    class EventListener {
        constructor() {
            /**
             * event listeners
             * @type {Array}
             * @private
             */
            this._listeners = [];
        }

        /**
         * add event listener
         * @param type
         * @param cb
         * @returns {{type: *, callback: *}}
         */
        addEventListener(type, cb) {
            let listener = { type: type, callback: cb };
            this._listeners.push(listener);
            return listener;
        }

        /**
         * remove event listener
         * @param listener
         */
        removeEventListener(listener) {
            for (let c = 0; c < this._listeners.length; c++) {
                if (listener === this._listeners[c]) {
                    this._listeners.splice(c, 0);
                    return;
                }
            }
        }

        /**
         * trigger event
         * @param custom event
         */
        triggerEvent(ce) {
            this._listeners.forEach( function(l) {
                if (ce.type === l.type) {
                    l.callback.apply(this, [ce]);
                }
            });
        }
    }

    const pointer = {
        add(scope) {
            scope.stage.scene.onPointerObservable.add((pointerInfo) => {
                if (scope.onPointer) {
                    scope.onPointer(pointerInfo);
                }

                if (scope.onMeshPointer) {
                    const pick = scope.stage.scene.pick(pointerInfo.event.clientX, pointerInfo.event.clientY);
                    if (pick.hit) {
                        scope.onMeshPointer(pick, pointerInfo);
                    }
                }
            });
        }
    };

    const xrcontrollers = {
        add(scope) {
            scope.xrcontrollers = [];
            scope._xrcontrollerButtonStates = [];

            const notifyApp = function(eventtype, button, controller) {
                const ray = controller.getForwardRay(99999);
                const pick = scope.stage.scene.pickWithRay(ray);
                if (scope.onControllerEvent) {
                    scope.onControllerEvent(eventtype, button, controller, pick);
                }
            };

            scope.stage.webxr.then( result => {
                const helper = result;
                if (helper.fallbackToWebVR) {
                    helper.enableInteractions();
                    helper.onControllerMeshLoadedObservable.add(controller => {
                        controller.onMainButtonStateChangedObservable.add((button) => {
                            notifyApp('mainbutton', button, controller);
                        });
                        controller.onTriggerStateChangedObservable.add((button) => {
                            notifyApp('trigger', button, controller);
                        });
                        controller.onSecondaryButtonStateChangedObservable.add((button) => {
                            notifyApp('secondarybutton', button, controller);
                        });
                        controller.onPadStateChangedObservable.add( (button) => {
                            notifyApp('padstate', button, controller);
                        });
                        controller.onPadValuesChangedObservable.add( (button) => {
                            notifyApp('padvalue', button, controller);
                        });

                        scope.xrcontrollers.push(controller);
                    });
                }
            });
        }
    };

    var Addons = /*#__PURE__*/Object.freeze({
        pointer: pointer,
        xrcontrollers: xrcontrollers
    });

    /**
     * from https://github.com/btford/url-resolver.js
     */

    var urlParsingNode = document.createElement("a");
    var originUrl = urlResolve(window.location.href);


    /**
     *
     * Implementation Notes for non-IE browsers
     * ----------------------------------------
     * Assigning a URL to the href property of an anchor DOM node, even one attached to the DOM,
     * results both in the normalizing and parsing of the URL.  Normalizing means that a relative
     * URL will be resolved into an absolute URL in the context of the application document.
     * Parsing means that the anchor node's host, hostname, protocol, port, pathname and related
     * properties are all populated to reflect the normalized URL.  This approach has wide
     * compatibility - Safari 1+, Mozilla 1+, Opera 7+,e etc.  See
     * http://www.aptana.com/reference/html/api/HTMLAnchorElement.html
     *
     * Implementation Notes for IE
     * ---------------------------
     * IE >= 8 and <= 10 normalizes the URL when assigned to the anchor node similar to the other
     * browsers.  However, the parsed components will not be set if the URL assigned did not specify
     * them.  (e.g. if you assign a.href = "foo", then a.protocol, a.host, etc. will be empty.)  We
     * work around that by performing the parsing in a 2nd step by taking a previously normalized
     * URL (e.g. by assigning to a.href) and assigning it a.href again.  This correctly populates the
     * properties such as protocol, hostname, port, etc.
     *
     * IE7 does not normalize the URL when assigned to an anchor node.  (Apparently, it does, if one
     * uses the inner HTML approach to assign the URL as part of an HTML snippet -
     * http://stackoverflow.com/a/472729)  However, setting img[src] does normalize the URL.
     * Unfortunately, setting img[src] to something like "javascript:foo" on IE throws an exception.
     * Since the primary usage for normalizing URLs is to sanitize such URLs, we can't use that
     * method and IE < 8 is unsupported.
     *
     * References:
     *   http://developer.mozilla.org/en-US/docs/Web/API/HTMLAnchorElement
     *   http://www.aptana.com/reference/html/api/HTMLAnchorElement.html
     *   http://url.spec.whatwg.org/#urlutils
     *   https://github.com/angular/angular.js/pull/2902
     *   http://james.padolsey.com/javascript/parsing-urls-with-the-dom/
     *
     * @function
     * @param {string} url The URL to be parsed.
     * @description Normalizes and parses a URL.
     * @returns {object} Returns the normalized URL as a dictionary.
     *
     *   | member name   | Description    |
     *   |---------------|----------------|
     *   | href          | A normalized version of the provided URL if it was not an absolute URL |
     *   | protocol      | The protocol including the trailing colon                              |
     *   | host          | The host and port (if the port is non-default) of the normalizedUrl    |
     *   | search        | The search params, minus the question mark                             |
     *   | hash          | The hash string, minus the hash symbol
     *   | hostname      | The hostname
     *   | port          | The port, without ":"
     *   | pathname      | The pathname, beginning with "/"
     *
     */
    function urlResolve(url, base) {
        var href = url;

        /*if (msie) {
            // Normalize before parse.  Refer Implementation Notes on why this is
            // done in two steps on IE.
            urlParsingNode.setAttribute("href", href);
            href = urlParsingNode.href;
        }*/

        urlParsingNode.setAttribute('href', href);

        // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
        return {
            href: urlParsingNode.href,
            protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
            host: urlParsingNode.host,
            search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
            hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
            hostname: urlParsingNode.hostname,
            port: urlParsingNode.port,
            pathname: (urlParsingNode.pathname.charAt(0) === '/')
                ? urlParsingNode.pathname
                : '/' + urlParsingNode.pathname
        };
    }

    class BaseApplication extends EventListener {

        static get Babylon() { return null; }

        constructor(o) {
            super();
            if (o.stage) {
                o.stage.setup(o.canvas, o.config, this).then( stage => {
                    stage.application = this;
                    this.stage = stage;
                    this.config = o.config;
                    this.stage.engine.runRenderLoop(() => {
                        this.stage.scene.render();
                        this.onRender(this.stage.engine.getDeltaTime());
                    });

                    if (this.config.addons) {
                        this.config.addons.split(',').forEach(addon => {
                            this.processAddon(addon);
                        });
                    }

                    this.stage.engine.resize();

                    window.addEventListener('resize', () => {
                        this.stage.engine.resize();
                        this.onResize();
                    });

                    this.triggerEvent(new CustomEvent('ready'));
                    this.onReady();
                });
            }
        }

        async processAddon(path) {
            if (path.toLowerCase().indexOf('.js') === -1) {
                // path is a built-in name
                Addons[path].add(this);
            } else {
                const absPath = urlResolve(path);
                const a = await import(path);
                a.default.add(this);
            }
        }

        onRender(deltaTime) {}
        onResize() {}
        onReady() {}
    }

    var DefaultStage = {
        async setup(canvas, config, clazz) {
            const stage = {
                canvas: canvas,
                config: config,
                app: clazz,
            };
            stage.babylon = this.setupBabylon(stage);
            stage.engine = this.setupEngine(stage);
            stage.scene = this.setupScene(stage);

            const cameras = this.setupCameras(stage);
            if (!Array.isArray(cameras))  {
                stage.cameras = [cameras];
            }  else {
                stage.cameras = cameras;
            }

            const lights = this.setupLights(stage);
            if (!Array.isArray(lights))  {
                stage.lights = [lights];
            }  else {
                stage.lights = lights;
            }
            stage.lights = lights;

            if (config.usewebxr) {
                stage.webxr = this.setupWebXR(stage);
            }

            return stage;
        },

        setupBabylon(stage) {
            // if user does not specify, auto-detect if BABYLON is present
            if (!stage.config.useglobalbabylon) {
                if (window.BABYLON) { return window.BABYLON; }
            }

            // if user does specify with true or no value, use BABYLON, error if not present
            if (stage.config.useglobalbabylon === true || stage.config.useglobalbabylon === "true") {
                if (window.BABYLON) {
                    return window.BABYLON;
                } else {
                    throw new Error('Babylon is not loaded, setup cannot continue, ensure that window.BABYLON exists')
                }
            }

            // Babylon provided by application?
            if (stage.app.constructor.Babylon) {
                return stage.app.constructor.Babylon;
            }
        },

        setupCameras(stage) {
            const Babylon = stage.babylon;
            const camera = new Babylon.UniversalCamera("UniversalCamera", new Babylon.Vector3(0, 0, -10), stage.scene);
            camera.setTarget(Babylon.Vector3.Zero());
            camera.attachControl(stage.canvas, true);
            return [camera];
        },

        setupEngine(stage) {
            const Babylon = stage.babylon;
            const engine = new Babylon.Engine(stage.canvas, true);
            engine.enableOfflineSupport = false;
            return engine;
        },

        setupScene(stage) {
            const Babylon = stage.babylon;
            const scene = new Babylon.Scene(stage.engine);

            if (stage.config.showdebuglayer) {
                scene.debugLayer.show( {
                    globalRoot: document.body,
                    handleResize: true
                });
            }

            if (stage.config.backgroundcolor) {
                scene.clearColor = Babylon.Color3.FromHexString(stage.config.backgroundcolor);
            }

            return scene;
        },

        setupLights(stage) {
            const Babylon = stage.babylon;
            const light = new Babylon.HemisphericLight('light', new Babylon.Vector3(0, 1, -1), stage.scene);
            light.intensity = 0.7;
            return [light];
        },


        async setupWebXR(stage) {
            const scene = stage.scene;
            const Babylon = stage.babylon;

            // Check WebXR support in case falling back to WebVR is necessary
            const environment = scene.createDefaultEnvironment({ enableGroundShadow: true, groundYBias: 1 });
            const xrHelper = await scene.createDefaultXRExperienceAsync({floorMeshes: [environment.ground]});
            if(!await xrHelper.baseExperience.sessionManager.supportsSessionAsync("immersive-vr")){
                const vr = scene.createDefaultVRExperience();
                vr.fallbackToWebVR = true;
                return vr;
            } else {
                return xrHelper;
            }
        },
    };

    /**
     * Babylon Scene Description
     *
     * @element babylon-scene
     *
     * @fires waiting - Use in combination with the "customsetup" attribute to listen for a pause where you can manipulate the stage
     * @fires playing - Fired when the 3D scene is set up and ready for content and interactivity to be added
     *
     * Core Component Attributes
     * @attr {Boolean} customsetup - if true, will stop setup prior to scene creation to allow the consumer to inject custom logic
     * @attr {CustomEvent} onwaiting - "waiting" event fires when "customsetup" is set to true to allow the consumer to inject custom logic.
     * @attr {CustomEvent} onplaying - "playing" event fires when the scene is fully setup and ready for adding logic and 3d objects.
     * @attr {String} app - path to application class module (relative to your HTML file)
     * @attr {String} stage - path to stage setup module (relative to your HTML file)
     *
     * Stage Attributes
     * @attr {Boolean} showdebuglayer - if true will automatically load the Babylon.js inspector UI at start
     * @attr {String} backgroundcolor - when set to a hex color (#ff0000 for red as an example), the Babylon.js background color will be set to this color
     * @attr {Boolean} useglobalbabylon - if true or not set, the Babylon instance defined on window.BABYLON (if found) will be used. Any built version included on a script tag, like from a CDN (https://cdn.babylonjs.com/babylon.js) will put this in place
     *
     * Base Application Attributes
     * @attr {String} addons - An optional comma separated list of addons to automatically use in your application. See add-ons for more details
     *
     * @prop {HTMLCanvasElement} canvas - Canvas used to render 3D scene
     * @prop {Stage} stage - Stage, or scene configuration containing lights, cameras, etc
     * @prop {Object} config - Object containing configuration options for component, stage, and application
     */


    class BabylonScene extends HTMLElement {

        static get CUSTOM_SETUP() {
            return 'customsetup';
        }

        constructor() {
            super();
            this.attachShadow({mode: 'open'});
            this.canvas = document.createElement('canvas');
            this.shadowRoot.appendChild(this.canvas);
        }

        init(app) {
            if (!app) {
                this.application = new BaseApplication(this);
            } else {
                this.application = app;
            }

            const listener = this.application.addEventListener('ready', () => {
                this.application.removeEventListener(listener);
                this.onSceneCreated();
            });
        }

        set stage(val) {
            this._stage = val;
            this.init(app);
        }

        get stage() {
            return this._stage;
        }

        onSceneCreated() {
            const ce = new CustomEvent('playing', {
                bubbles: true,
                detail: this.application.stage
            });
            this.dispatchEvent(ce);
            this.sceneIsReady = true;
        }

        async connectedCallback() {
            // when using show debug layer, component gets reparented and this is called twice
            if (this._connectedCallbackFired) { return; }
            this._connectedCallbackFired = true;

            this.style.display = 'inline-block';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';

            this.config = {};

            this.getAttributeNames().forEach( attr => {
                const val = this.getAttribute(attr) ? this.getAttribute(attr) : true;
                if (attr !== 'style' && attr !== 'class') {
                    this.config[attr] = val;
                }
            });

            this.config.babylonComponent = this;

            if (this.config.stage) {
                const absPath = urlResolve(this.config.stage).href;
                const {default: CustomStage} = await import(absPath);
                this._stage = CustomStage;
            } else {
                this._stage = DefaultStage;
            }

            if (this.config.app) {
                const absPath = urlResolve(this.config.app).href;
                const {default: App} = await import(absPath);
                this.init(new App(this));
                return;
            }

            if (!this.config.customsetup) {
                this.init();
                return;
            }

            const ce = new CustomEvent('waiting', {
                bubbles: true,
                detail: {
                    canvas: this.canvas,
                    stage: DefaultStage,
                    config: this.config
                }});
            this.dispatchEvent(ce);
        }
    }

    if (!customElements.get('babylon-scene')) {
        customElements.define('babylon-scene', BabylonScene);
    }

    return BabylonScene;

}());
//# sourceMappingURL=babylonscene.nobabylon.js.map
