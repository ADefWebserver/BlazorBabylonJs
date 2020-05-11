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
            debugger;
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
!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define("babylonjs",[],t):"object"==typeof exports?exports.babylonjs=t():e.BABYLON=t()}("undefined"!=typeof self?self:"undefined"!=typeof global?global:this,function(){return function(e){var t={};function i(n){if(t[n])return t[n].exports;var r=t[n]={i:n,l:!1,exports:{}};return e[n].call(r.exports,r,r.exports,i),r.l=!0,r.exports}return i.m=e,i.c=t,i.d=function(e,t,n){i.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},i.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},i.t=function(e,t){if(1&t&&(e=i(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(i.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)i.d(n,r,function(t){return e[t]}.bind(null,r));return n},i.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return i.d(t,"a",t),t},i.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},i.p="",i(i.s=129)}([function(e,t,i){"use strict";i.d(t,"u",function(){return s}),i.d(t,"v",function(){return a}),i.d(t,"h",function(){return c}),i.d(t,"e",function(){return l}),i.d(t,"f",function(){return u}),i.d(t,"w",function(){return h}),i.d(t,"x",function(){return d}),i.d(t,"y",function(){return f}),i.d(t,"r",function(){return p}),i.d(t,"q",function(){return _}),i.d(t,"j",function(){return g}),i.d(t,"n",function(){return m}),i.d(t,"z",function(){return v}),i.d(t,"i",function(){return y}),i.d(t,"s",function(){return n}),i.d(t,"c",function(){return T}),i.d(t,"d",function(){return E}),i.d(t,"k",function(){return b}),i.d(t,"a",function(){return A}),i.d(t,"b",function(){return x}),i.d(t,"l",function(){return R}),i.d(t,"m",function(){return P}),i.d(t,"g",function(){return S}),i.d(t,"p",function(){return C}),i.d(t,"o",function(){return M}),i.d(t,"t",function(){return O});var n,r=i(34),o=i(12),s=1/2.2,a=2.2,c=.001,l=function(){function e(e,t,i){void 0===e&&(e=0),void 0===t&&(t=0),void 0===i&&(i=0),this.r=e,this.g=t,this.b=i}return e.prototype.toString=function(){return"{R: "+this.r+" G:"+this.g+" B:"+this.b+"}"},e.prototype.getClassName=function(){return"Color3"},e.prototype.getHashCode=function(){var e=this.r||0;return e=397*(e=397*e^(this.g||0))^(this.b||0)},e.prototype.toArray=function(e,t){return void 0===t&&(t=0),e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,this},e.prototype.toColor4=function(e){return void 0===e&&(e=1),new u(this.r,this.g,this.b,e)},e.prototype.asArray=function(){var e=new Array;return this.toArray(e,0),e},e.prototype.toLuminance=function(){return.3*this.r+.59*this.g+.11*this.b},e.prototype.multiply=function(t){return new e(this.r*t.r,this.g*t.g,this.b*t.b)},e.prototype.multiplyToRef=function(e,t){return t.r=this.r*e.r,t.g=this.g*e.g,t.b=this.b*e.b,this},e.prototype.equals=function(e){return e&&this.r===e.r&&this.g===e.g&&this.b===e.b},e.prototype.equalsFloats=function(e,t,i){return this.r===e&&this.g===t&&this.b===i},e.prototype.scale=function(t){return new e(this.r*t,this.g*t,this.b*t)},e.prototype.scaleToRef=function(e,t){return t.r=this.r*e,t.g=this.g*e,t.b=this.b*e,this},e.prototype.scaleAndAddToRef=function(e,t){return t.r+=this.r*e,t.g+=this.g*e,t.b+=this.b*e,this},e.prototype.clampToRef=function(e,t,i){return void 0===e&&(e=0),void 0===t&&(t=1),i.r=o.a.Clamp(this.r,e,t),i.g=o.a.Clamp(this.g,e,t),i.b=o.a.Clamp(this.b,e,t),this},e.prototype.add=function(t){return new e(this.r+t.r,this.g+t.g,this.b+t.b)},e.prototype.addToRef=function(e,t){return t.r=this.r+e.r,t.g=this.g+e.g,t.b=this.b+e.b,this},e.prototype.subtract=function(t){return new e(this.r-t.r,this.g-t.g,this.b-t.b)},e.prototype.subtractToRef=function(e,t){return t.r=this.r-e.r,t.g=this.g-e.g,t.b=this.b-e.b,this},e.prototype.clone=function(){return new e(this.r,this.g,this.b)},e.prototype.copyFrom=function(e){return this.r=e.r,this.g=e.g,this.b=e.b,this},e.prototype.copyFromFloats=function(e,t,i){return this.r=e,this.g=t,this.b=i,this},e.prototype.set=function(e,t,i){return this.copyFromFloats(e,t,i)},e.prototype.toHexString=function(){var e=255*this.r|0,t=255*this.g|0,i=255*this.b|0;return"#"+o.a.ToHex(e)+o.a.ToHex(t)+o.a.ToHex(i)},e.prototype.toLinearSpace=function(){var t=new e;return this.toLinearSpaceToRef(t),t},e.prototype.toLinearSpaceToRef=function(e){return e.r=Math.pow(this.r,a),e.g=Math.pow(this.g,a),e.b=Math.pow(this.b,a),this},e.prototype.toGammaSpace=function(){var t=new e;return this.toGammaSpaceToRef(t),t},e.prototype.toGammaSpaceToRef=function(e){return e.r=Math.pow(this.r,s),e.g=Math.pow(this.g,s),e.b=Math.pow(this.b,s),this},e.FromHexString=function(t){if("#"!==t.substring(0,1)||7!==t.length)return new e(0,0,0);var i=parseInt(t.substring(1,3),16),n=parseInt(t.substring(3,5),16),r=parseInt(t.substring(5,7),16);return e.FromInts(i,n,r)},e.FromArray=function(t,i){return void 0===i&&(i=0),new e(t[i],t[i+1],t[i+2])},e.FromInts=function(t,i,n){return new e(t/255,i/255,n/255)},e.Lerp=function(t,i,n){var r=new e(0,0,0);return e.LerpToRef(t,i,n,r),r},e.LerpToRef=function(e,t,i,n){n.r=e.r+(t.r-e.r)*i,n.g=e.g+(t.g-e.g)*i,n.b=e.b+(t.b-e.b)*i},e.Red=function(){return new e(1,0,0)},e.Green=function(){return new e(0,1,0)},e.Blue=function(){return new e(0,0,1)},e.Black=function(){return new e(0,0,0)},Object.defineProperty(e,"BlackReadOnly",{get:function(){return e._BlackReadOnly},enumerable:!0,configurable:!0}),e.White=function(){return new e(1,1,1)},e.Purple=function(){return new e(.5,0,.5)},e.Magenta=function(){return new e(1,0,1)},e.Yellow=function(){return new e(1,1,0)},e.Gray=function(){return new e(.5,.5,.5)},e.Teal=function(){return new e(0,1,1)},e.Random=function(){return new e(Math.random(),Math.random(),Math.random())},e._BlackReadOnly=e.Black(),e}(),u=function(){function e(e,t,i,n){void 0===e&&(e=0),void 0===t&&(t=0),void 0===i&&(i=0),void 0===n&&(n=1),this.r=e,this.g=t,this.b=i,this.a=n}return e.prototype.addInPlace=function(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this.a+=e.a,this},e.prototype.asArray=function(){var e=new Array;return this.toArray(e,0),e},e.prototype.toArray=function(e,t){return void 0===t&&(t=0),e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e[t+3]=this.a,this},e.prototype.equals=function(e){return e&&this.r===e.r&&this.g===e.g&&this.b===e.b&&this.a===e.a},e.prototype.add=function(t){return new e(this.r+t.r,this.g+t.g,this.b+t.b,this.a+t.a)},e.prototype.subtract=function(t){return new e(this.r-t.r,this.g-t.g,this.b-t.b,this.a-t.a)},e.prototype.subtractToRef=function(e,t){return t.r=this.r-e.r,t.g=this.g-e.g,t.b=this.b-e.b,t.a=this.a-e.a,this},e.prototype.scale=function(t){return new e(this.r*t,this.g*t,this.b*t,this.a*t)},e.prototype.scaleToRef=function(e,t){return t.r=this.r*e,t.g=this.g*e,t.b=this.b*e,t.a=this.a*e,this},e.prototype.scaleAndAddToRef=function(e,t){return t.r+=this.r*e,t.g+=this.g*e,t.b+=this.b*e,t.a+=this.a*e,this},e.prototype.clampToRef=function(e,t,i){return void 0===e&&(e=0),void 0===t&&(t=1),i.r=o.a.Clamp(this.r,e,t),i.g=o.a.Clamp(this.g,e,t),i.b=o.a.Clamp(this.b,e,t),i.a=o.a.Clamp(this.a,e,t),this},e.prototype.multiply=function(t){return new e(this.r*t.r,this.g*t.g,this.b*t.b,this.a*t.a)},e.prototype.multiplyToRef=function(e,t){return t.r=this.r*e.r,t.g=this.g*e.g,t.b=this.b*e.b,t.a=this.a*e.a,t},e.prototype.toString=function(){return"{R: "+this.r+" G:"+this.g+" B:"+this.b+" A:"+this.a+"}"},e.prototype.getClassName=function(){return"Color4"},e.prototype.getHashCode=function(){var e=this.r||0;return e=397*(e=397*(e=397*e^(this.g||0))^(this.b||0))^(this.a||0)},e.prototype.clone=function(){return new e(this.r,this.g,this.b,this.a)},e.prototype.copyFrom=function(e){return this.r=e.r,this.g=e.g,this.b=e.b,this.a=e.a,this},e.prototype.copyFromFloats=function(e,t,i,n){return this.r=e,this.g=t,this.b=i,this.a=n,this},e.prototype.set=function(e,t,i,n){return this.copyFromFloats(e,t,i,n)},e.prototype.toHexString=function(){var e=255*this.r|0,t=255*this.g|0,i=255*this.b|0,n=255*this.a|0;return"#"+o.a.ToHex(e)+o.a.ToHex(t)+o.a.ToHex(i)+o.a.ToHex(n)},e.prototype.toLinearSpace=function(){var t=new e;return this.toLinearSpaceToRef(t),t},e.prototype.toLinearSpaceToRef=function(e){return e.r=Math.pow(this.r,a),e.g=Math.pow(this.g,a),e.b=Math.pow(this.b,a),e.a=this.a,this},e.prototype.toGammaSpace=function(){var t=new e;return this.toGammaSpaceToRef(t),t},e.prototype.toGammaSpaceToRef=function(e){return e.r=Math.pow(this.r,s),e.g=Math.pow(this.g,s),e.b=Math.pow(this.b,s),e.a=this.a,this},e.FromHexString=function(t){if("#"!==t.substring(0,1)||9!==t.length)return new e(0,0,0,0);var i=parseInt(t.substring(1,3),16),n=parseInt(t.substring(3,5),16),r=parseInt(t.substring(5,7),16),o=parseInt(t.substring(7,9),16);return e.FromInts(i,n,r,o)},e.Lerp=function(t,i,n){var r=new e(0,0,0,0);return e.LerpToRef(t,i,n,r),r},e.LerpToRef=function(e,t,i,n){n.r=e.r+(t.r-e.r)*i,n.g=e.g+(t.g-e.g)*i,n.b=e.b+(t.b-e.b)*i,n.a=e.a+(t.a-e.a)*i},e.FromColor3=function(t,i){return void 0===i&&(i=1),new e(t.r,t.g,t.b,i)},e.FromArray=function(t,i){return void 0===i&&(i=0),new e(t[i],t[i+1],t[i+2],t[i+3])},e.FromInts=function(t,i,n,r){return new e(t/255,i/255,n/255,r/255)},e.CheckColors4=function(e,t){if(e.length===3*t){for(var i=[],n=0;n<e.length;n+=3){var r=n/3*4;i[r]=e[n],i[r+1]=e[n+1],i[r+2]=e[n+2],i[r+3]=1}return i}return e},e}(),h=function(){function e(e,t){void 0===e&&(e=0),void 0===t&&(t=0),this.x=e,this.y=t}return e.prototype.toString=function(){return"{X: "+this.x+" Y:"+this.y+"}"},e.prototype.getClassName=function(){return"Vector2"},e.prototype.getHashCode=function(){var e=this.x||0;return e=397*e^(this.y||0)},e.prototype.toArray=function(e,t){return void 0===t&&(t=0),e[t]=this.x,e[t+1]=this.y,this},e.prototype.asArray=function(){var e=new Array;return this.toArray(e,0),e},e.prototype.copyFrom=function(e){return this.x=e.x,this.y=e.y,this},e.prototype.copyFromFloats=function(e,t){return this.x=e,this.y=t,this},e.prototype.set=function(e,t){return this.copyFromFloats(e,t)},e.prototype.add=function(t){return new e(this.x+t.x,this.y+t.y)},e.prototype.addToRef=function(e,t){return t.x=this.x+e.x,t.y=this.y+e.y,this},e.prototype.addInPlace=function(e){return this.x+=e.x,this.y+=e.y,this},e.prototype.addVector3=function(t){return new e(this.x+t.x,this.y+t.y)},e.prototype.subtract=function(t){return new e(this.x-t.x,this.y-t.y)},e.prototype.subtractToRef=function(e,t){return t.x=this.x-e.x,t.y=this.y-e.y,this},e.prototype.subtractInPlace=function(e){return this.x-=e.x,this.y-=e.y,this},e.prototype.multiplyInPlace=function(e){return this.x*=e.x,this.y*=e.y,this},e.prototype.multiply=function(t){return new e(this.x*t.x,this.y*t.y)},e.prototype.multiplyToRef=function(e,t){return t.x=this.x*e.x,t.y=this.y*e.y,this},e.prototype.multiplyByFloats=function(t,i){return new e(this.x*t,this.y*i)},e.prototype.divide=function(t){return new e(this.x/t.x,this.y/t.y)},e.prototype.divideToRef=function(e,t){return t.x=this.x/e.x,t.y=this.y/e.y,this},e.prototype.divideInPlace=function(e){return this.divideToRef(e,this)},e.prototype.negate=function(){return new e(-this.x,-this.y)},e.prototype.scaleInPlace=function(e){return this.x*=e,this.y*=e,this},e.prototype.scale=function(t){var i=new e(0,0);return this.scaleToRef(t,i),i},e.prototype.scaleToRef=function(e,t){return t.x=this.x*e,t.y=this.y*e,this},e.prototype.scaleAndAddToRef=function(e,t){return t.x+=this.x*e,t.y+=this.y*e,this},e.prototype.equals=function(e){return e&&this.x===e.x&&this.y===e.y},e.prototype.equalsWithEpsilon=function(e,t){return void 0===t&&(t=c),e&&o.a.WithinEpsilon(this.x,e.x,t)&&o.a.WithinEpsilon(this.y,e.y,t)},e.prototype.floor=function(){return new e(Math.floor(this.x),Math.floor(this.y))},e.prototype.fract=function(){return new e(this.x-Math.floor(this.x),this.y-Math.floor(this.y))},e.prototype.length=function(){return Math.sqrt(this.x*this.x+this.y*this.y)},e.prototype.lengthSquared=function(){return this.x*this.x+this.y*this.y},e.prototype.normalize=function(){var e=this.length();if(0===e)return this;var t=1/e;return this.x*=t,this.y*=t,this},e.prototype.clone=function(){return new e(this.x,this.y)},e.Zero=function(){return new e(0,0)},e.One=function(){return new e(1,1)},e.FromArray=function(t,i){return void 0===i&&(i=0),new e(t[i],t[i+1])},e.FromArrayToRef=function(e,t,i){i.x=e[t],i.y=e[t+1]},e.CatmullRom=function(t,i,n,r,o){var s=o*o,a=o*s;return new e(.5*(2*i.x+(-t.x+n.x)*o+(2*t.x-5*i.x+4*n.x-r.x)*s+(-t.x+3*i.x-3*n.x+r.x)*a),.5*(2*i.y+(-t.y+n.y)*o+(2*t.y-5*i.y+4*n.y-r.y)*s+(-t.y+3*i.y-3*n.y+r.y)*a))},e.Clamp=function(t,i,n){var r=t.x;r=(r=r>n.x?n.x:r)<i.x?i.x:r;var o=t.y;return new e(r,o=(o=o>n.y?n.y:o)<i.y?i.y:o)},e.Hermite=function(t,i,n,r,o){var s=o*o,a=o*s,c=2*a-3*s+1,l=-2*a+3*s,u=a-2*s+o,h=a-s;return new e(t.x*c+n.x*l+i.x*u+r.x*h,t.y*c+n.y*l+i.y*u+r.y*h)},e.Lerp=function(t,i,n){return new e(t.x+(i.x-t.x)*n,t.y+(i.y-t.y)*n)},e.Dot=function(e,t){return e.x*t.x+e.y*t.y},e.Normalize=function(e){var t=e.clone();return t.normalize(),t},e.Minimize=function(t,i){return new e(t.x<i.x?t.x:i.x,t.y<i.y?t.y:i.y)},e.Maximize=function(t,i){return new e(t.x>i.x?t.x:i.x,t.y>i.y?t.y:i.y)},e.Transform=function(t,i){var n=e.Zero();return e.TransformToRef(t,i,n),n},e.TransformToRef=function(e,t,i){var n=t.m,r=e.x*n[0]+e.y*n[4]+n[12],o=e.x*n[1]+e.y*n[5]+n[13];i.x=r,i.y=o},e.PointInTriangle=function(e,t,i,n){var r=.5*(-i.y*n.x+t.y*(-i.x+n.x)+t.x*(i.y-n.y)+i.x*n.y),o=r<0?-1:1,s=(t.y*n.x-t.x*n.y+(n.y-t.y)*e.x+(t.x-n.x)*e.y)*o,a=(t.x*i.y-t.y*i.x+(t.y-i.y)*e.x+(i.x-t.x)*e.y)*o;return s>0&&a>0&&s+a<2*r*o},e.Distance=function(t,i){return Math.sqrt(e.DistanceSquared(t,i))},e.DistanceSquared=function(e,t){var i=e.x-t.x,n=e.y-t.y;return i*i+n*n},e.Center=function(e,t){var i=e.add(t);return i.scaleInPlace(.5),i},e.DistanceOfPointFromSegment=function(t,i,n){var r=e.DistanceSquared(i,n);if(0===r)return e.Distance(t,i);var o=n.subtract(i),s=Math.max(0,Math.min(1,e.Dot(t.subtract(i),o)/r)),a=i.add(o.multiplyByFloats(s,s));return e.Distance(t,a)},e}(),d=function(){function e(e,t,i){void 0===e&&(e=0),void 0===t&&(t=0),void 0===i&&(i=0),this.x=e,this.y=t,this.z=i}return e.prototype.toString=function(){return"{X: "+this.x+" Y:"+this.y+" Z:"+this.z+"}"},e.prototype.getClassName=function(){return"Vector3"},e.prototype.getHashCode=function(){var e=this.x||0;return e=397*(e=397*e^(this.y||0))^(this.z||0)},e.prototype.asArray=function(){var e=[];return this.toArray(e,0),e},e.prototype.toArray=function(e,t){return void 0===t&&(t=0),e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,this},e.prototype.toQuaternion=function(){return _.RotationYawPitchRoll(this.y,this.x,this.z)},e.prototype.addInPlace=function(e){return this.addInPlaceFromFloats(e.x,e.y,e.z)},e.prototype.addInPlaceFromFloats=function(e,t,i){return this.x+=e,this.y+=t,this.z+=i,this},e.prototype.add=function(t){return new e(this.x+t.x,this.y+t.y,this.z+t.z)},e.prototype.addToRef=function(e,t){return t.copyFromFloats(this.x+e.x,this.y+e.y,this.z+e.z)},e.prototype.subtractInPlace=function(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this},e.prototype.subtract=function(t){return new e(this.x-t.x,this.y-t.y,this.z-t.z)},e.prototype.subtractToRef=function(e,t){return this.subtractFromFloatsToRef(e.x,e.y,e.z,t)},e.prototype.subtractFromFloats=function(t,i,n){return new e(this.x-t,this.y-i,this.z-n)},e.prototype.subtractFromFloatsToRef=function(e,t,i,n){return n.copyFromFloats(this.x-e,this.y-t,this.z-i)},e.prototype.negate=function(){return new e(-this.x,-this.y,-this.z)},e.prototype.scaleInPlace=function(e){return this.x*=e,this.y*=e,this.z*=e,this},e.prototype.scale=function(t){return new e(this.x*t,this.y*t,this.z*t)},e.prototype.scaleToRef=function(e,t){return t.copyFromFloats(this.x*e,this.y*e,this.z*e)},e.prototype.scaleAndAddToRef=function(e,t){return t.addInPlaceFromFloats(this.x*e,this.y*e,this.z*e)},e.prototype.equals=function(e){return e&&this.x===e.x&&this.y===e.y&&this.z===e.z},e.prototype.equalsWithEpsilon=function(e,t){return void 0===t&&(t=c),e&&o.a.WithinEpsilon(this.x,e.x,t)&&o.a.WithinEpsilon(this.y,e.y,t)&&o.a.WithinEpsilon(this.z,e.z,t)},e.prototype.equalsToFloats=function(e,t,i){return this.x===e&&this.y===t&&this.z===i},e.prototype.multiplyInPlace=function(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this},e.prototype.multiply=function(e){return this.multiplyByFloats(e.x,e.y,e.z)},e.prototype.multiplyToRef=function(e,t){return t.copyFromFloats(this.x*e.x,this.y*e.y,this.z*e.z)},e.prototype.multiplyByFloats=function(t,i,n){return new e(this.x*t,this.y*i,this.z*n)},e.prototype.divide=function(t){return new e(this.x/t.x,this.y/t.y,this.z/t.z)},e.prototype.divideToRef=function(e,t){return t.copyFromFloats(this.x/e.x,this.y/e.y,this.z/e.z)},e.prototype.divideInPlace=function(e){return this.divideToRef(e,this)},e.prototype.minimizeInPlace=function(e){return this.minimizeInPlaceFromFloats(e.x,e.y,e.z)},e.prototype.maximizeInPlace=function(e){return this.maximizeInPlaceFromFloats(e.x,e.y,e.z)},e.prototype.minimizeInPlaceFromFloats=function(e,t,i){return e<this.x&&(this.x=e),t<this.y&&(this.y=t),i<this.z&&(this.z=i),this},e.prototype.maximizeInPlaceFromFloats=function(e,t,i){return e>this.x&&(this.x=e),t>this.y&&(this.y=t),i>this.z&&(this.z=i),this},e.prototype.isNonUniformWithinEpsilon=function(e){var t=Math.abs(this.x),i=Math.abs(this.y);if(!o.a.WithinEpsilon(t,i,e))return!0;var n=Math.abs(this.z);return!o.a.WithinEpsilon(t,n,e)||!o.a.WithinEpsilon(i,n,e)},Object.defineProperty(e.prototype,"isNonUniform",{get:function(){var e=Math.abs(this.x),t=Math.abs(this.y);if(e!==t)return!0;var i=Math.abs(this.z);return e!==i||t!==i},enumerable:!0,configurable:!0}),e.prototype.floor=function(){return new e(Math.floor(this.x),Math.floor(this.y),Math.floor(this.z))},e.prototype.fract=function(){return new e(this.x-Math.floor(this.x),this.y-Math.floor(this.y),this.z-Math.floor(this.z))},e.prototype.length=function(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)},e.prototype.lengthSquared=function(){return this.x*this.x+this.y*this.y+this.z*this.z},e.prototype.normalize=function(){return this.normalizeFromLength(this.length())},e.prototype.reorderInPlace=function(e){var t=this;return"xyz"===(e=e.toLowerCase())?this:(I.Vector3[0].copyFrom(this),["x","y","z"].forEach(function(i,n){t[i]=I.Vector3[0][e[n]]}),this)},e.prototype.rotateByQuaternionToRef=function(t,i){return t.toRotationMatrix(I.Matrix[0]),e.TransformCoordinatesToRef(this,I.Matrix[0],i),i},e.prototype.rotateByQuaternionAroundPointToRef=function(e,t,i){return this.subtractToRef(t,I.Vector3[0]),I.Vector3[0].rotateByQuaternionToRef(e,I.Vector3[0]),t.addToRef(I.Vector3[0],i),i},e.prototype.normalizeFromLength=function(e){return 0===e||1===e?this:this.scaleInPlace(1/e)},e.prototype.normalizeToNew=function(){var t=new e(0,0,0);return this.normalizeToRef(t),t},e.prototype.normalizeToRef=function(e){var t=this.length();return 0===t||1===t?e.copyFromFloats(this.x,this.y,this.z):this.scaleToRef(1/t,e)},e.prototype.clone=function(){return new e(this.x,this.y,this.z)},e.prototype.copyFrom=function(e){return this.copyFromFloats(e.x,e.y,e.z)},e.prototype.copyFromFloats=function(e,t,i){return this.x=e,this.y=t,this.z=i,this},e.prototype.set=function(e,t,i){return this.copyFromFloats(e,t,i)},e.prototype.setAll=function(e){return this.x=this.y=this.z=e,this},e.GetClipFactor=function(t,i,n,r){var o=e.Dot(t,n)-r;return o/(o-(e.Dot(i,n)-r))},e.GetAngleBetweenVectors=function(t,i,n){var r=t.normalizeToRef(I.Vector3[1]),o=i.normalizeToRef(I.Vector3[2]),s=e.Dot(r,o),a=I.Vector3[3];return e.CrossToRef(r,o,a),e.Dot(a,n)>0?Math.acos(s):-Math.acos(s)},e.FromArray=function(t,i){return void 0===i&&(i=0),new e(t[i],t[i+1],t[i+2])},e.FromFloatArray=function(t,i){return e.FromArray(t,i)},e.FromArrayToRef=function(e,t,i){i.x=e[t],i.y=e[t+1],i.z=e[t+2]},e.FromFloatArrayToRef=function(t,i,n){return e.FromArrayToRef(t,i,n)},e.FromFloatsToRef=function(e,t,i,n){n.copyFromFloats(e,t,i)},e.Zero=function(){return new e(0,0,0)},e.One=function(){return new e(1,1,1)},e.Up=function(){return new e(0,1,0)},Object.defineProperty(e,"UpReadOnly",{get:function(){return e._UpReadOnly},enumerable:!0,configurable:!0}),e.Down=function(){return new e(0,-1,0)},e.Forward=function(){return new e(0,0,1)},e.Backward=function(){return new e(0,0,-1)},e.Right=function(){return new e(1,0,0)},e.Left=function(){return new e(-1,0,0)},e.TransformCoordinates=function(t,i){var n=e.Zero();return e.TransformCoordinatesToRef(t,i,n),n},e.TransformCoordinatesToRef=function(t,i,n){e.TransformCoordinatesFromFloatsToRef(t.x,t.y,t.z,i,n)},e.TransformCoordinatesFromFloatsToRef=function(e,t,i,n,r){var o=n.m,s=e*o[0]+t*o[4]+i*o[8]+o[12],a=e*o[1]+t*o[5]+i*o[9]+o[13],c=e*o[2]+t*o[6]+i*o[10]+o[14],l=1/(e*o[3]+t*o[7]+i*o[11]+o[15]);r.x=s*l,r.y=a*l,r.z=c*l},e.TransformNormal=function(t,i){var n=e.Zero();return e.TransformNormalToRef(t,i,n),n},e.TransformNormalToRef=function(e,t,i){this.TransformNormalFromFloatsToRef(e.x,e.y,e.z,t,i)},e.TransformNormalFromFloatsToRef=function(e,t,i,n,r){var o=n.m;r.x=e*o[0]+t*o[4]+i*o[8],r.y=e*o[1]+t*o[5]+i*o[9],r.z=e*o[2]+t*o[6]+i*o[10]},e.CatmullRom=function(t,i,n,r,o){var s=o*o,a=o*s;return new e(.5*(2*i.x+(-t.x+n.x)*o+(2*t.x-5*i.x+4*n.x-r.x)*s+(-t.x+3*i.x-3*n.x+r.x)*a),.5*(2*i.y+(-t.y+n.y)*o+(2*t.y-5*i.y+4*n.y-r.y)*s+(-t.y+3*i.y-3*n.y+r.y)*a),.5*(2*i.z+(-t.z+n.z)*o+(2*t.z-5*i.z+4*n.z-r.z)*s+(-t.z+3*i.z-3*n.z+r.z)*a))},e.Clamp=function(t,i,n){var r=new e;return e.ClampToRef(t,i,n,r),r},e.ClampToRef=function(e,t,i,n){var r=e.x;r=(r=r>i.x?i.x:r)<t.x?t.x:r;var o=e.y;o=(o=o>i.y?i.y:o)<t.y?t.y:o;var s=e.z;s=(s=s>i.z?i.z:s)<t.z?t.z:s,n.copyFromFloats(r,o,s)},e.Hermite=function(t,i,n,r,o){var s=o*o,a=o*s,c=2*a-3*s+1,l=-2*a+3*s,u=a-2*s+o,h=a-s;return new e(t.x*c+n.x*l+i.x*u+r.x*h,t.y*c+n.y*l+i.y*u+r.y*h,t.z*c+n.z*l+i.z*u+r.z*h)},e.Lerp=function(t,i,n){var r=new e(0,0,0);return e.LerpToRef(t,i,n,r),r},e.LerpToRef=function(e,t,i,n){n.x=e.x+(t.x-e.x)*i,n.y=e.y+(t.y-e.y)*i,n.z=e.z+(t.z-e.z)*i},e.Dot=function(e,t){return e.x*t.x+e.y*t.y+e.z*t.z},e.Cross=function(t,i){var n=e.Zero();return e.CrossToRef(t,i,n),n},e.CrossToRef=function(e,t,i){var n=e.y*t.z-e.z*t.y,r=e.z*t.x-e.x*t.z,o=e.x*t.y-e.y*t.x;i.copyFromFloats(n,r,o)},e.Normalize=function(t){var i=e.Zero();return e.NormalizeToRef(t,i),i},e.NormalizeToRef=function(e,t){e.normalizeToRef(t)},e.Project=function(t,i,n,r){var o=r.width,s=r.height,a=r.x,c=r.y,l=I.Matrix[1];g.FromValuesToRef(o/2,0,0,0,0,-s/2,0,0,0,0,.5,0,a+o/2,s/2+c,.5,1,l);var u=I.Matrix[0];return i.multiplyToRef(n,u),u.multiplyToRef(l,u),e.TransformCoordinates(t,u)},e._UnprojectFromInvertedMatrixToRef=function(t,i,n){e.TransformCoordinatesToRef(t,i,n);var r=i.m,s=t.x*r[3]+t.y*r[7]+t.z*r[11]+r[15];o.a.WithinEpsilon(s,1)&&n.scaleInPlace(1/s)},e.UnprojectFromTransform=function(t,i,n,r,o){var s=I.Matrix[0];r.multiplyToRef(o,s),s.invert(),t.x=t.x/i*2-1,t.y=-(t.y/n*2-1);var a=new e;return e._UnprojectFromInvertedMatrixToRef(t,s,a),a},e.Unproject=function(t,i,n,r,o,s){var a=e.Zero();return e.UnprojectToRef(t,i,n,r,o,s,a),a},e.UnprojectToRef=function(t,i,n,r,o,s,a){e.UnprojectFloatsToRef(t.x,t.y,t.z,i,n,r,o,s,a)},e.UnprojectFloatsToRef=function(t,i,n,r,o,s,a,c,l){var u=I.Matrix[0];s.multiplyToRef(a,u),u.multiplyToRef(c,u),u.invert();var h=I.Vector3[0];h.x=t/r*2-1,h.y=-(i/o*2-1),h.z=2*n-1,e._UnprojectFromInvertedMatrixToRef(h,u,l)},e.Minimize=function(e,t){var i=e.clone();return i.minimizeInPlace(t),i},e.Maximize=function(e,t){var i=e.clone();return i.maximizeInPlace(t),i},e.Distance=function(t,i){return Math.sqrt(e.DistanceSquared(t,i))},e.DistanceSquared=function(e,t){var i=e.x-t.x,n=e.y-t.y,r=e.z-t.z;return i*i+n*n+r*r},e.Center=function(e,t){var i=e.add(t);return i.scaleInPlace(.5),i},e.RotationFromAxis=function(t,i,n){var r=e.Zero();return e.RotationFromAxisToRef(t,i,n,r),r},e.RotationFromAxisToRef=function(e,t,i,n){var r=I.Quaternion[0];_.RotationQuaternionFromAxisToRef(e,t,i,r),r.toEulerAnglesToRef(n)},e._UpReadOnly=e.Up(),e}(),f=function(){function e(e,t,i,n){this.x=e,this.y=t,this.z=i,this.w=n}return e.prototype.toString=function(){return"{X: "+this.x+" Y:"+this.y+" Z:"+this.z+" W:"+this.w+"}"},e.prototype.getClassName=function(){return"Vector4"},e.prototype.getHashCode=function(){var e=this.x||0;return e=397*(e=397*(e=397*e^(this.y||0))^(this.z||0))^(this.w||0)},e.prototype.asArray=function(){var e=new Array;return this.toArray(e,0),e},e.prototype.toArray=function(e,t){return void 0===t&&(t=0),e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,this},e.prototype.addInPlace=function(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this},e.prototype.add=function(t){return new e(this.x+t.x,this.y+t.y,this.z+t.z,this.w+t.w)},e.prototype.addToRef=function(e,t){return t.x=this.x+e.x,t.y=this.y+e.y,t.z=this.z+e.z,t.w=this.w+e.w,this},e.prototype.subtractInPlace=function(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this},e.prototype.subtract=function(t){return new e(this.x-t.x,this.y-t.y,this.z-t.z,this.w-t.w)},e.prototype.subtractToRef=function(e,t){return t.x=this.x-e.x,t.y=this.y-e.y,t.z=this.z-e.z,t.w=this.w-e.w,this},e.prototype.subtractFromFloats=function(t,i,n,r){return new e(this.x-t,this.y-i,this.z-n,this.w-r)},e.prototype.subtractFromFloatsToRef=function(e,t,i,n,r){return r.x=this.x-e,r.y=this.y-t,r.z=this.z-i,r.w=this.w-n,this},e.prototype.negate=function(){return new e(-this.x,-this.y,-this.z,-this.w)},e.prototype.scaleInPlace=function(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this},e.prototype.scale=function(t){return new e(this.x*t,this.y*t,this.z*t,this.w*t)},e.prototype.scaleToRef=function(e,t){return t.x=this.x*e,t.y=this.y*e,t.z=this.z*e,t.w=this.w*e,this},e.prototype.scaleAndAddToRef=function(e,t){return t.x+=this.x*e,t.y+=this.y*e,t.z+=this.z*e,t.w+=this.w*e,this},e.prototype.equals=function(e){return e&&this.x===e.x&&this.y===e.y&&this.z===e.z&&this.w===e.w},e.prototype.equalsWithEpsilon=function(e,t){return void 0===t&&(t=c),e&&o.a.WithinEpsilon(this.x,e.x,t)&&o.a.WithinEpsilon(this.y,e.y,t)&&o.a.WithinEpsilon(this.z,e.z,t)&&o.a.WithinEpsilon(this.w,e.w,t)},e.prototype.equalsToFloats=function(e,t,i,n){return this.x===e&&this.y===t&&this.z===i&&this.w===n},e.prototype.multiplyInPlace=function(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this},e.prototype.multiply=function(t){return new e(this.x*t.x,this.y*t.y,this.z*t.z,this.w*t.w)},e.prototype.multiplyToRef=function(e,t){return t.x=this.x*e.x,t.y=this.y*e.y,t.z=this.z*e.z,t.w=this.w*e.w,this},e.prototype.multiplyByFloats=function(t,i,n,r){return new e(this.x*t,this.y*i,this.z*n,this.w*r)},e.prototype.divide=function(t){return new e(this.x/t.x,this.y/t.y,this.z/t.z,this.w/t.w)},e.prototype.divideToRef=function(e,t){return t.x=this.x/e.x,t.y=this.y/e.y,t.z=this.z/e.z,t.w=this.w/e.w,this},e.prototype.divideInPlace=function(e){return this.divideToRef(e,this)},e.prototype.minimizeInPlace=function(e){return e.x<this.x&&(this.x=e.x),e.y<this.y&&(this.y=e.y),e.z<this.z&&(this.z=e.z),e.w<this.w&&(this.w=e.w),this},e.prototype.maximizeInPlace=function(e){return e.x>this.x&&(this.x=e.x),e.y>this.y&&(this.y=e.y),e.z>this.z&&(this.z=e.z),e.w>this.w&&(this.w=e.w),this},e.prototype.floor=function(){return new e(Math.floor(this.x),Math.floor(this.y),Math.floor(this.z),Math.floor(this.w))},e.prototype.fract=function(){return new e(this.x-Math.floor(this.x),this.y-Math.floor(this.y),this.z-Math.floor(this.z),this.w-Math.floor(this.w))},e.prototype.length=function(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)},e.prototype.lengthSquared=function(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w},e.prototype.normalize=function(){var e=this.length();return 0===e?this:this.scaleInPlace(1/e)},e.prototype.toVector3=function(){return new d(this.x,this.y,this.z)},e.prototype.clone=function(){return new e(this.x,this.y,this.z,this.w)},e.prototype.copyFrom=function(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w,this},e.prototype.copyFromFloats=function(e,t,i,n){return this.x=e,this.y=t,this.z=i,this.w=n,this},e.prototype.set=function(e,t,i,n){return this.copyFromFloats(e,t,i,n)},e.prototype.setAll=function(e){return this.x=this.y=this.z=this.w=e,this},e.FromArray=function(t,i){return i||(i=0),new e(t[i],t[i+1],t[i+2],t[i+3])},e.FromArrayToRef=function(e,t,i){i.x=e[t],i.y=e[t+1],i.z=e[t+2],i.w=e[t+3]},e.FromFloatArrayToRef=function(t,i,n){e.FromArrayToRef(t,i,n)},e.FromFloatsToRef=function(e,t,i,n,r){r.x=e,r.y=t,r.z=i,r.w=n},e.Zero=function(){return new e(0,0,0,0)},e.One=function(){return new e(1,1,1,1)},e.Normalize=function(t){var i=e.Zero();return e.NormalizeToRef(t,i),i},e.NormalizeToRef=function(e,t){t.copyFrom(e),t.normalize()},e.Minimize=function(e,t){var i=e.clone();return i.minimizeInPlace(t),i},e.Maximize=function(e,t){var i=e.clone();return i.maximizeInPlace(t),i},e.Distance=function(t,i){return Math.sqrt(e.DistanceSquared(t,i))},e.DistanceSquared=function(e,t){var i=e.x-t.x,n=e.y-t.y,r=e.z-t.z,o=e.w-t.w;return i*i+n*n+r*r+o*o},e.Center=function(e,t){var i=e.add(t);return i.scaleInPlace(.5),i},e.TransformNormal=function(t,i){var n=e.Zero();return e.TransformNormalToRef(t,i,n),n},e.TransformNormalToRef=function(e,t,i){var n=t.m,r=e.x*n[0]+e.y*n[4]+e.z*n[8],o=e.x*n[1]+e.y*n[5]+e.z*n[9],s=e.x*n[2]+e.y*n[6]+e.z*n[10];i.x=r,i.y=o,i.z=s,i.w=e.w},e.TransformNormalFromFloatsToRef=function(e,t,i,n,r,o){var s=r.m;o.x=e*s[0]+t*s[4]+i*s[8],o.y=e*s[1]+t*s[5]+i*s[9],o.z=e*s[2]+t*s[6]+i*s[10],o.w=n},e.FromVector3=function(t,i){return void 0===i&&(i=0),new e(t.x,t.y,t.z,i)},e}(),p=function(){function e(e,t){this.width=e,this.height=t}return e.prototype.toString=function(){return"{W: "+this.width+", H: "+this.height+"}"},e.prototype.getClassName=function(){return"Size"},e.prototype.getHashCode=function(){var e=this.width||0;return e=397*e^(this.height||0)},e.prototype.copyFrom=function(e){this.width=e.width,this.height=e.height},e.prototype.copyFromFloats=function(e,t){return this.width=e,this.height=t,this},e.prototype.set=function(e,t){return this.copyFromFloats(e,t)},e.prototype.multiplyByFloats=function(t,i){return new e(this.width*t,this.height*i)},e.prototype.clone=function(){return new e(this.width,this.height)},e.prototype.equals=function(e){return!!e&&(this.width===e.width&&this.height===e.height)},Object.defineProperty(e.prototype,"surface",{get:function(){return this.width*this.height},enumerable:!0,configurable:!0}),e.Zero=function(){return new e(0,0)},e.prototype.add=function(t){return new e(this.width+t.width,this.height+t.height)},e.prototype.subtract=function(t){return new e(this.width-t.width,this.height-t.height)},e.Lerp=function(t,i,n){return new e(t.width+(i.width-t.width)*n,t.height+(i.height-t.height)*n)},e}(),_=function(){function e(e,t,i,n){void 0===e&&(e=0),void 0===t&&(t=0),void 0===i&&(i=0),void 0===n&&(n=1),this.x=e,this.y=t,this.z=i,this.w=n}return e.prototype.toString=function(){return"{X: "+this.x+" Y:"+this.y+" Z:"+this.z+" W:"+this.w+"}"},e.prototype.getClassName=function(){return"Quaternion"},e.prototype.getHashCode=function(){var e=this.x||0;return e=397*(e=397*(e=397*e^(this.y||0))^(this.z||0))^(this.w||0)},e.prototype.asArray=function(){return[this.x,this.y,this.z,this.w]},e.prototype.equals=function(e){return e&&this.x===e.x&&this.y===e.y&&this.z===e.z&&this.w===e.w},e.prototype.clone=function(){return new e(this.x,this.y,this.z,this.w)},e.prototype.copyFrom=function(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w,this},e.prototype.copyFromFloats=function(e,t,i,n){return this.x=e,this.y=t,this.z=i,this.w=n,this},e.prototype.set=function(e,t,i,n){return this.copyFromFloats(e,t,i,n)},e.prototype.add=function(t){return new e(this.x+t.x,this.y+t.y,this.z+t.z,this.w+t.w)},e.prototype.addInPlace=function(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this},e.prototype.subtract=function(t){return new e(this.x-t.x,this.y-t.y,this.z-t.z,this.w-t.w)},e.prototype.scale=function(t){return new e(this.x*t,this.y*t,this.z*t,this.w*t)},e.prototype.scaleToRef=function(e,t){return t.x=this.x*e,t.y=this.y*e,t.z=this.z*e,t.w=this.w*e,this},e.prototype.scaleInPlace=function(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this},e.prototype.scaleAndAddToRef=function(e,t){return t.x+=this.x*e,t.y+=this.y*e,t.z+=this.z*e,t.w+=this.w*e,this},e.prototype.multiply=function(t){var i=new e(0,0,0,1);return this.multiplyToRef(t,i),i},e.prototype.multiplyToRef=function(e,t){var i=this.x*e.w+this.y*e.z-this.z*e.y+this.w*e.x,n=-this.x*e.z+this.y*e.w+this.z*e.x+this.w*e.y,r=this.x*e.y-this.y*e.x+this.z*e.w+this.w*e.z,o=-this.x*e.x-this.y*e.y-this.z*e.z+this.w*e.w;return t.copyFromFloats(i,n,r,o),this},e.prototype.multiplyInPlace=function(e){return this.multiplyToRef(e,this),this},e.prototype.conjugateToRef=function(e){return e.copyFromFloats(-this.x,-this.y,-this.z,this.w),this},e.prototype.conjugateInPlace=function(){return this.x*=-1,this.y*=-1,this.z*=-1,this},e.prototype.conjugate=function(){return new e(-this.x,-this.y,-this.z,this.w)},e.prototype.length=function(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)},e.prototype.normalize=function(){var e=this.length();if(0===e)return this;var t=1/e;return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this},e.prototype.toEulerAngles=function(e){void 0===e&&(e="YZX");var t=d.Zero();return this.toEulerAnglesToRef(t),t},e.prototype.toEulerAnglesToRef=function(e){var t=this.z,i=this.x,n=this.y,r=this.w,o=r*r,s=t*t,a=i*i,c=n*n,l=n*t-i*r;return l<-.4999999?(e.y=2*Math.atan2(n,r),e.x=Math.PI/2,e.z=0):l>.4999999?(e.y=2*Math.atan2(n,r),e.x=-Math.PI/2,e.z=0):(e.z=Math.atan2(2*(i*n+t*r),-s-a+c+o),e.x=Math.asin(-2*(t*n-i*r)),e.y=Math.atan2(2*(t*i+n*r),s-a-c+o)),this},e.prototype.toRotationMatrix=function(e){return g.FromQuaternionToRef(this,e),this},e.prototype.fromRotationMatrix=function(t){return e.FromRotationMatrixToRef(t,this),this},e.FromRotationMatrix=function(t){var i=new e;return e.FromRotationMatrixToRef(t,i),i},e.FromRotationMatrixToRef=function(e,t){var i,n=e.m,r=n[0],o=n[4],s=n[8],a=n[1],c=n[5],l=n[9],u=n[2],h=n[6],d=n[10],f=r+c+d;f>0?(i=.5/Math.sqrt(f+1),t.w=.25/i,t.x=(h-l)*i,t.y=(s-u)*i,t.z=(a-o)*i):r>c&&r>d?(i=2*Math.sqrt(1+r-c-d),t.w=(h-l)/i,t.x=.25*i,t.y=(o+a)/i,t.z=(s+u)/i):c>d?(i=2*Math.sqrt(1+c-r-d),t.w=(s-u)/i,t.x=(o+a)/i,t.y=.25*i,t.z=(l+h)/i):(i=2*Math.sqrt(1+d-r-c),t.w=(a-o)/i,t.x=(s+u)/i,t.y=(l+h)/i,t.z=.25*i)},e.Dot=function(e,t){return e.x*t.x+e.y*t.y+e.z*t.z+e.w*t.w},e.AreClose=function(t,i){return e.Dot(t,i)>=0},e.Zero=function(){return new e(0,0,0,0)},e.Inverse=function(t){return new e(-t.x,-t.y,-t.z,t.w)},e.InverseToRef=function(e,t){return t.set(-e.x,-e.y,-e.z,e.w),t},e.Identity=function(){return new e(0,0,0,1)},e.IsIdentity=function(e){return e&&0===e.x&&0===e.y&&0===e.z&&1===e.w},e.RotationAxis=function(t,i){return e.RotationAxisToRef(t,i,new e)},e.RotationAxisToRef=function(e,t,i){var n=Math.sin(t/2);return e.normalize(),i.w=Math.cos(t/2),i.x=e.x*n,i.y=e.y*n,i.z=e.z*n,i},e.FromArray=function(t,i){return i||(i=0),new e(t[i],t[i+1],t[i+2],t[i+3])},e.FromEulerAngles=function(t,i,n){var r=new e;return e.RotationYawPitchRollToRef(i,t,n,r),r},e.FromEulerAnglesToRef=function(t,i,n,r){return e.RotationYawPitchRollToRef(i,t,n,r),r},e.FromEulerVector=function(t){var i=new e;return e.RotationYawPitchRollToRef(t.y,t.x,t.z,i),i},e.FromEulerVectorToRef=function(t,i){return e.RotationYawPitchRollToRef(t.y,t.x,t.z,i),i},e.RotationYawPitchRoll=function(t,i,n){var r=new e;return e.RotationYawPitchRollToRef(t,i,n,r),r},e.RotationYawPitchRollToRef=function(e,t,i,n){var r=.5*i,o=.5*t,s=.5*e,a=Math.sin(r),c=Math.cos(r),l=Math.sin(o),u=Math.cos(o),h=Math.sin(s),d=Math.cos(s);n.x=d*l*c+h*u*a,n.y=h*u*c-d*l*a,n.z=d*u*a-h*l*c,n.w=d*u*c+h*l*a},e.RotationAlphaBetaGamma=function(t,i,n){var r=new e;return e.RotationAlphaBetaGammaToRef(t,i,n,r),r},e.RotationAlphaBetaGammaToRef=function(e,t,i,n){var r=.5*(i+e),o=.5*(i-e),s=.5*t;n.x=Math.cos(o)*Math.sin(s),n.y=Math.sin(o)*Math.sin(s),n.z=Math.sin(r)*Math.cos(s),n.w=Math.cos(r)*Math.cos(s)},e.RotationQuaternionFromAxis=function(t,i,n){var r=new e(0,0,0,0);return e.RotationQuaternionFromAxisToRef(t,i,n,r),r},e.RotationQuaternionFromAxisToRef=function(t,i,n,r){var o=I.Matrix[0];g.FromXYZAxesToRef(t.normalize(),i.normalize(),n.normalize(),o),e.FromRotationMatrixToRef(o,r)},e.Slerp=function(t,i,n){var r=e.Identity();return e.SlerpToRef(t,i,n,r),r},e.SlerpToRef=function(e,t,i,n){var r,o,s=e.x*t.x+e.y*t.y+e.z*t.z+e.w*t.w,a=!1;if(s<0&&(a=!0,s=-s),s>.999999)o=1-i,r=a?-i:i;else{var c=Math.acos(s),l=1/Math.sin(c);o=Math.sin((1-i)*c)*l,r=a?-Math.sin(i*c)*l:Math.sin(i*c)*l}n.x=o*e.x+r*t.x,n.y=o*e.y+r*t.y,n.z=o*e.z+r*t.z,n.w=o*e.w+r*t.w},e.Hermite=function(t,i,n,r,o){var s=o*o,a=o*s,c=2*a-3*s+1,l=-2*a+3*s,u=a-2*s+o,h=a-s;return new e(t.x*c+n.x*l+i.x*u+r.x*h,t.y*c+n.y*l+i.y*u+r.y*h,t.z*c+n.z*l+i.z*u+r.z*h,t.w*c+n.w*l+i.w*u+r.w*h)},e}(),g=function(){function e(){this._isIdentity=!1,this._isIdentityDirty=!0,this._isIdentity3x2=!0,this._isIdentity3x2Dirty=!0,this.updateFlag=-1,this._m=new Float32Array(16),this._updateIdentityStatus(!1)}return Object.defineProperty(e.prototype,"m",{get:function(){return this._m},enumerable:!0,configurable:!0}),e.prototype._markAsUpdated=function(){this.updateFlag=e._updateFlagSeed++,this._isIdentity=!1,this._isIdentity3x2=!1,this._isIdentityDirty=!0,this._isIdentity3x2Dirty=!0},e.prototype._updateIdentityStatus=function(t,i,n,r){void 0===i&&(i=!1),void 0===n&&(n=!1),void 0===r&&(r=!0),this.updateFlag=e._updateFlagSeed++,this._isIdentity=t,this._isIdentity3x2=t||n,this._isIdentityDirty=!this._isIdentity&&i,this._isIdentity3x2Dirty=!this._isIdentity3x2&&r},e.prototype.isIdentity=function(){if(this._isIdentityDirty){this._isIdentityDirty=!1;var e=this._m;this._isIdentity=1===e[0]&&0===e[1]&&0===e[2]&&0===e[3]&&0===e[4]&&1===e[5]&&0===e[6]&&0===e[7]&&0===e[8]&&0===e[9]&&1===e[10]&&0===e[11]&&0===e[12]&&0===e[13]&&0===e[14]&&1===e[15]}return this._isIdentity},e.prototype.isIdentityAs3x2=function(){return this._isIdentity3x2Dirty&&(this._isIdentity3x2Dirty=!1,1!==this._m[0]||1!==this._m[5]||1!==this._m[15]?this._isIdentity3x2=!1:0!==this._m[1]||0!==this._m[2]||0!==this._m[3]||0!==this._m[4]||0!==this._m[6]||0!==this._m[7]||0!==this._m[8]||0!==this._m[9]||0!==this._m[10]||0!==this._m[11]||0!==this._m[12]||0!==this._m[13]||0!==this._m[14]?this._isIdentity3x2=!1:this._isIdentity3x2=!0),this._isIdentity3x2},e.prototype.determinant=function(){if(!0===this._isIdentity)return 1;var e=this._m,t=e[0],i=e[1],n=e[2],r=e[3],o=e[4],s=e[5],a=e[6],c=e[7],l=e[8],u=e[9],h=e[10],d=e[11],f=e[12],p=e[13],_=e[14],g=e[15],m=h*g-_*d,v=u*g-p*d,y=u*_-p*h,b=l*g-f*d,T=l*_-h*f,E=l*p-f*u;return t*+(s*m-a*v+c*y)+i*-(o*m-a*b+c*T)+n*+(o*v-s*b+c*E)+r*-(o*y-s*T+a*E)},e.prototype.toArray=function(){return this._m},e.prototype.asArray=function(){return this._m},e.prototype.invert=function(){return this.invertToRef(this),this},e.prototype.reset=function(){return e.FromValuesToRef(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,this),this._updateIdentityStatus(!1),this},e.prototype.add=function(t){var i=new e;return this.addToRef(t,i),i},e.prototype.addToRef=function(e,t){for(var i=this._m,n=t._m,r=e.m,o=0;o<16;o++)n[o]=i[o]+r[o];return t._markAsUpdated(),this},e.prototype.addToSelf=function(e){for(var t=this._m,i=e.m,n=0;n<16;n++)t[n]+=i[n];return this._markAsUpdated(),this},e.prototype.invertToRef=function(t){if(!0===this._isIdentity)return e.IdentityToRef(t),this;var i=this._m,n=i[0],r=i[1],o=i[2],s=i[3],a=i[4],c=i[5],l=i[6],u=i[7],h=i[8],d=i[9],f=i[10],p=i[11],_=i[12],g=i[13],m=i[14],v=i[15],y=f*v-m*p,b=d*v-g*p,T=d*m-g*f,E=h*v-_*p,A=h*m-f*_,x=h*g-_*d,R=+(c*y-l*b+u*T),P=-(a*y-l*E+u*A),S=+(a*b-c*E+u*x),C=-(a*T-c*A+l*x),M=n*R+r*P+o*S+s*C;if(0===M)return t.copyFrom(this),this;var O=1/M,I=l*v-m*u,D=c*v-g*u,L=c*m-g*l,w=a*v-_*u,F=a*m-_*l,N=a*g-_*c,B=l*p-f*u,U=c*p-d*u,V=c*f-d*l,G=a*p-h*u,k=a*f-h*l,z=a*d-h*c,j=-(r*y-o*b+s*T),H=+(n*y-o*E+s*A),W=-(n*b-r*E+s*x),X=+(n*T-r*A+o*x),Y=+(r*I-o*D+s*L),K=-(n*I-o*w+s*F),Q=+(n*D-r*w+s*N),q=-(n*L-r*F+o*N),Z=-(r*B-o*U+s*V),J=+(n*B-o*G+s*k),$=-(n*U-r*G+s*z),ee=+(n*V-r*k+o*z);return e.FromValuesToRef(R*O,j*O,Y*O,Z*O,P*O,H*O,K*O,J*O,S*O,W*O,Q*O,$*O,C*O,X*O,q*O,ee*O,t),this},e.prototype.addAtIndex=function(e,t){return this._m[e]+=t,this._markAsUpdated(),this},e.prototype.multiplyAtIndex=function(e,t){return this._m[e]*=t,this._markAsUpdated(),this},e.prototype.setTranslationFromFloats=function(e,t,i){return this._m[12]=e,this._m[13]=t,this._m[14]=i,this._markAsUpdated(),this},e.prototype.addTranslationFromFloats=function(e,t,i){return this._m[12]+=e,this._m[13]+=t,this._m[14]+=i,this._markAsUpdated(),this},e.prototype.setTranslation=function(e){return this.setTranslationFromFloats(e.x,e.y,e.z)},e.prototype.getTranslation=function(){return new d(this._m[12],this._m[13],this._m[14])},e.prototype.getTranslationToRef=function(e){return e.x=this._m[12],e.y=this._m[13],e.z=this._m[14],this},e.prototype.removeRotationAndScaling=function(){var t=this.m;return e.FromValuesToRef(1,0,0,0,0,1,0,0,0,0,1,0,t[12],t[13],t[14],t[15],this),this._updateIdentityStatus(0===t[12]&&0===t[13]&&0===t[14]&&1===t[15]),this},e.prototype.multiply=function(t){var i=new e;return this.multiplyToRef(t,i),i},e.prototype.copyFrom=function(e){e.copyToArray(this._m);var t=e;return this._updateIdentityStatus(t._isIdentity,t._isIdentityDirty,t._isIdentity3x2,t._isIdentity3x2Dirty),this},e.prototype.copyToArray=function(e,t){void 0===t&&(t=0);for(var i=0;i<16;i++)e[t+i]=this._m[i];return this},e.prototype.multiplyToRef=function(e,t){return this._isIdentity?(t.copyFrom(e),this):e._isIdentity?(t.copyFrom(this),this):(this.multiplyToArray(e,t._m,0),t._markAsUpdated(),this)},e.prototype.multiplyToArray=function(e,t,i){var n=this._m,r=e.m,o=n[0],s=n[1],a=n[2],c=n[3],l=n[4],u=n[5],h=n[6],d=n[7],f=n[8],p=n[9],_=n[10],g=n[11],m=n[12],v=n[13],y=n[14],b=n[15],T=r[0],E=r[1],A=r[2],x=r[3],R=r[4],P=r[5],S=r[6],C=r[7],M=r[8],O=r[9],I=r[10],D=r[11],L=r[12],w=r[13],F=r[14],N=r[15];return t[i]=o*T+s*R+a*M+c*L,t[i+1]=o*E+s*P+a*O+c*w,t[i+2]=o*A+s*S+a*I+c*F,t[i+3]=o*x+s*C+a*D+c*N,t[i+4]=l*T+u*R+h*M+d*L,t[i+5]=l*E+u*P+h*O+d*w,t[i+6]=l*A+u*S+h*I+d*F,t[i+7]=l*x+u*C+h*D+d*N,t[i+8]=f*T+p*R+_*M+g*L,t[i+9]=f*E+p*P+_*O+g*w,t[i+10]=f*A+p*S+_*I+g*F,t[i+11]=f*x+p*C+_*D+g*N,t[i+12]=m*T+v*R+y*M+b*L,t[i+13]=m*E+v*P+y*O+b*w,t[i+14]=m*A+v*S+y*I+b*F,t[i+15]=m*x+v*C+y*D+b*N,this},e.prototype.equals=function(e){var t=e;if(!t)return!1;if((this._isIdentity||t._isIdentity)&&!this._isIdentityDirty&&!t._isIdentityDirty)return this._isIdentity&&t._isIdentity;var i=this.m,n=t.m;return i[0]===n[0]&&i[1]===n[1]&&i[2]===n[2]&&i[3]===n[3]&&i[4]===n[4]&&i[5]===n[5]&&i[6]===n[6]&&i[7]===n[7]&&i[8]===n[8]&&i[9]===n[9]&&i[10]===n[10]&&i[11]===n[11]&&i[12]===n[12]&&i[13]===n[13]&&i[14]===n[14]&&i[15]===n[15]},e.prototype.clone=function(){var t=new e;return t.copyFrom(this),t},e.prototype.getClassName=function(){return"Matrix"},e.prototype.getHashCode=function(){for(var e=this._m[0]||0,t=1;t<16;t++)e=397*e^(this._m[t]||0);return e},e.prototype.decompose=function(t,i,n){if(this._isIdentity)return n&&n.setAll(0),t&&t.setAll(1),i&&i.copyFromFloats(0,0,0,1),!0;var r=this._m;if(n&&n.copyFromFloats(r[12],r[13],r[14]),(t=t||I.Vector3[0]).x=Math.sqrt(r[0]*r[0]+r[1]*r[1]+r[2]*r[2]),t.y=Math.sqrt(r[4]*r[4]+r[5]*r[5]+r[6]*r[6]),t.z=Math.sqrt(r[8]*r[8]+r[9]*r[9]+r[10]*r[10]),this.determinant()<=0&&(t.y*=-1),0===t.x||0===t.y||0===t.z)return i&&i.copyFromFloats(0,0,0,1),!1;if(i){var o=1/t.x,s=1/t.y,a=1/t.z;e.FromValuesToRef(r[0]*o,r[1]*o,r[2]*o,0,r[4]*s,r[5]*s,r[6]*s,0,r[8]*a,r[9]*a,r[10]*a,0,0,0,0,1,I.Matrix[0]),_.FromRotationMatrixToRef(I.Matrix[0],i)}return!0},e.prototype.getRow=function(e){if(e<0||e>3)return null;var t=4*e;return new f(this._m[t+0],this._m[t+1],this._m[t+2],this._m[t+3])},e.prototype.setRow=function(e,t){return this.setRowFromFloats(e,t.x,t.y,t.z,t.w)},e.prototype.transpose=function(){return e.Transpose(this)},e.prototype.transposeToRef=function(t){return e.TransposeToRef(this,t),this},e.prototype.setRowFromFloats=function(e,t,i,n,r){if(e<0||e>3)return this;var o=4*e;return this._m[o+0]=t,this._m[o+1]=i,this._m[o+2]=n,this._m[o+3]=r,this._markAsUpdated(),this},e.prototype.scale=function(t){var i=new e;return this.scaleToRef(t,i),i},e.prototype.scaleToRef=function(e,t){for(var i=0;i<16;i++)t._m[i]=this._m[i]*e;return t._markAsUpdated(),this},e.prototype.scaleAndAddToRef=function(e,t){for(var i=0;i<16;i++)t._m[i]+=this._m[i]*e;return t._markAsUpdated(),this},e.prototype.toNormalMatrix=function(t){var i=I.Matrix[0];this.invertToRef(i),i.transposeToRef(t);var n=t._m;e.FromValuesToRef(n[0],n[1],n[2],0,n[4],n[5],n[6],0,n[8],n[9],n[10],0,0,0,0,1,t)},e.prototype.getRotationMatrix=function(){var t=new e;return this.getRotationMatrixToRef(t),t},e.prototype.getRotationMatrixToRef=function(t){var i=I.Vector3[0];if(!this.decompose(i))return e.IdentityToRef(t),this;var n=this._m,r=1/i.x,o=1/i.y,s=1/i.z;return e.FromValuesToRef(n[0]*r,n[1]*r,n[2]*r,0,n[4]*o,n[5]*o,n[6]*o,0,n[8]*s,n[9]*s,n[10]*s,0,0,0,0,1,t),this},e.prototype.toggleModelMatrixHandInPlace=function(){var e=this._m;e[2]*=-1,e[6]*=-1,e[8]*=-1,e[9]*=-1,e[14]*=-1,this._markAsUpdated()},e.prototype.toggleProjectionMatrixHandInPlace=function(){var e=this._m;e[8]*=-1,e[9]*=-1,e[10]*=-1,e[11]*=-1,this._markAsUpdated()},e.FromArray=function(t,i){void 0===i&&(i=0);var n=new e;return e.FromArrayToRef(t,i,n),n},e.FromArrayToRef=function(e,t,i){for(var n=0;n<16;n++)i._m[n]=e[n+t];i._markAsUpdated()},e.FromFloat32ArrayToRefScaled=function(e,t,i,n){for(var r=0;r<16;r++)n._m[r]=e[r+t]*i;n._markAsUpdated()},Object.defineProperty(e,"IdentityReadOnly",{get:function(){return e._identityReadOnly},enumerable:!0,configurable:!0}),e.FromValuesToRef=function(e,t,i,n,r,o,s,a,c,l,u,h,d,f,p,_,g){var m=g._m;m[0]=e,m[1]=t,m[2]=i,m[3]=n,m[4]=r,m[5]=o,m[6]=s,m[7]=a,m[8]=c,m[9]=l,m[10]=u,m[11]=h,m[12]=d,m[13]=f,m[14]=p,m[15]=_,g._markAsUpdated()},e.FromValues=function(t,i,n,r,o,s,a,c,l,u,h,d,f,p,_,g){var m=new e,v=m._m;return v[0]=t,v[1]=i,v[2]=n,v[3]=r,v[4]=o,v[5]=s,v[6]=a,v[7]=c,v[8]=l,v[9]=u,v[10]=h,v[11]=d,v[12]=f,v[13]=p,v[14]=_,v[15]=g,m._markAsUpdated(),m},e.Compose=function(t,i,n){var r=new e;return e.ComposeToRef(t,i,n,r),r},e.ComposeToRef=function(e,t,i,n){var r=n._m,o=t.x,s=t.y,a=t.z,c=t.w,l=o+o,u=s+s,h=a+a,d=o*l,f=o*u,p=o*h,_=s*u,g=s*h,m=a*h,v=c*l,y=c*u,b=c*h,T=e.x,E=e.y,A=e.z;r[0]=(1-(_+m))*T,r[1]=(f+b)*T,r[2]=(p-y)*T,r[3]=0,r[4]=(f-b)*E,r[5]=(1-(d+m))*E,r[6]=(g+v)*E,r[7]=0,r[8]=(p+y)*A,r[9]=(g-v)*A,r[10]=(1-(d+_))*A,r[11]=0,r[12]=i.x,r[13]=i.y,r[14]=i.z,r[15]=1,n._markAsUpdated()},e.Identity=function(){var t=e.FromValues(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1);return t._updateIdentityStatus(!0),t},e.IdentityToRef=function(t){e.FromValuesToRef(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,t),t._updateIdentityStatus(!0)},e.Zero=function(){var t=e.FromValues(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);return t._updateIdentityStatus(!1),t},e.RotationX=function(t){var i=new e;return e.RotationXToRef(t,i),i},e.Invert=function(t){var i=new e;return t.invertToRef(i),i},e.RotationXToRef=function(t,i){var n=Math.sin(t),r=Math.cos(t);e.FromValuesToRef(1,0,0,0,0,r,n,0,0,-n,r,0,0,0,0,1,i),i._updateIdentityStatus(1===r&&0===n)},e.RotationY=function(t){var i=new e;return e.RotationYToRef(t,i),i},e.RotationYToRef=function(t,i){var n=Math.sin(t),r=Math.cos(t);e.FromValuesToRef(r,0,-n,0,0,1,0,0,n,0,r,0,0,0,0,1,i),i._updateIdentityStatus(1===r&&0===n)},e.RotationZ=function(t){var i=new e;return e.RotationZToRef(t,i),i},e.RotationZToRef=function(t,i){var n=Math.sin(t),r=Math.cos(t);e.FromValuesToRef(r,n,0,0,-n,r,0,0,0,0,1,0,0,0,0,1,i),i._updateIdentityStatus(1===r&&0===n)},e.RotationAxis=function(t,i){var n=new e;return e.RotationAxisToRef(t,i,n),n},e.RotationAxisToRef=function(e,t,i){var n=Math.sin(-t),r=Math.cos(-t),o=1-r;e.normalize();var s=i._m;s[0]=e.x*e.x*o+r,s[1]=e.x*e.y*o-e.z*n,s[2]=e.x*e.z*o+e.y*n,s[3]=0,s[4]=e.y*e.x*o+e.z*n,s[5]=e.y*e.y*o+r,s[6]=e.y*e.z*o-e.x*n,s[7]=0,s[8]=e.z*e.x*o-e.y*n,s[9]=e.z*e.y*o+e.x*n,s[10]=e.z*e.z*o+r,s[11]=0,s[12]=0,s[13]=0,s[14]=0,s[15]=1,i._markAsUpdated()},e.RotationAlignToRef=function(e,t,i){var n=d.Cross(t,e),r=d.Dot(t,e),o=1/(1+r),s=i._m;s[0]=n.x*n.x*o+r,s[1]=n.y*n.x*o-n.z,s[2]=n.z*n.x*o+n.y,s[3]=0,s[4]=n.x*n.y*o+n.z,s[5]=n.y*n.y*o+r,s[6]=n.z*n.y*o-n.x,s[7]=0,s[8]=n.x*n.z*o-n.y,s[9]=n.y*n.z*o+n.x,s[10]=n.z*n.z*o+r,s[11]=0,s[12]=0,s[13]=0,s[14]=0,s[15]=1,i._markAsUpdated()},e.RotationYawPitchRoll=function(t,i,n){var r=new e;return e.RotationYawPitchRollToRef(t,i,n,r),r},e.RotationYawPitchRollToRef=function(e,t,i,n){_.RotationYawPitchRollToRef(e,t,i,I.Quaternion[0]),I.Quaternion[0].toRotationMatrix(n)},e.Scaling=function(t,i,n){var r=new e;return e.ScalingToRef(t,i,n,r),r},e.ScalingToRef=function(t,i,n,r){e.FromValuesToRef(t,0,0,0,0,i,0,0,0,0,n,0,0,0,0,1,r),r._updateIdentityStatus(1===t&&1===i&&1===n)},e.Translation=function(t,i,n){var r=new e;return e.TranslationToRef(t,i,n,r),r},e.TranslationToRef=function(t,i,n,r){e.FromValuesToRef(1,0,0,0,0,1,0,0,0,0,1,0,t,i,n,1,r),r._updateIdentityStatus(0===t&&0===i&&0===n)},e.Lerp=function(t,i,n){var r=new e;return e.LerpToRef(t,i,n,r),r},e.LerpToRef=function(e,t,i,n){for(var r=n._m,o=e.m,s=t.m,a=0;a<16;a++)r[a]=o[a]*(1-i)+s[a]*i;n._markAsUpdated()},e.DecomposeLerp=function(t,i,n){var r=new e;return e.DecomposeLerpToRef(t,i,n,r),r},e.DecomposeLerpToRef=function(t,i,n,r){var o=I.Vector3[0],s=I.Quaternion[0],a=I.Vector3[1];t.decompose(o,s,a);var c=I.Vector3[2],l=I.Quaternion[1],u=I.Vector3[3];i.decompose(c,l,u);var h=I.Vector3[4];d.LerpToRef(o,c,n,h);var f=I.Quaternion[2];_.SlerpToRef(s,l,n,f);var p=I.Vector3[5];d.LerpToRef(a,u,n,p),e.ComposeToRef(h,f,p,r)},e.LookAtLH=function(t,i,n){var r=new e;return e.LookAtLHToRef(t,i,n,r),r},e.LookAtLHToRef=function(t,i,n,r){var o=I.Vector3[0],s=I.Vector3[1],a=I.Vector3[2];i.subtractToRef(t,a),a.normalize(),d.CrossToRef(n,a,o);var c=o.lengthSquared();0===c?o.x=1:o.normalizeFromLength(Math.sqrt(c)),d.CrossToRef(a,o,s),s.normalize();var l=-d.Dot(o,t),u=-d.Dot(s,t),h=-d.Dot(a,t);e.FromValuesToRef(o.x,s.x,a.x,0,o.y,s.y,a.y,0,o.z,s.z,a.z,0,l,u,h,1,r)},e.LookAtRH=function(t,i,n){var r=new e;return e.LookAtRHToRef(t,i,n,r),r},e.LookAtRHToRef=function(t,i,n,r){var o=I.Vector3[0],s=I.Vector3[1],a=I.Vector3[2];t.subtractToRef(i,a),a.normalize(),d.CrossToRef(n,a,o);var c=o.lengthSquared();0===c?o.x=1:o.normalizeFromLength(Math.sqrt(c)),d.CrossToRef(a,o,s),s.normalize();var l=-d.Dot(o,t),u=-d.Dot(s,t),h=-d.Dot(a,t);e.FromValuesToRef(o.x,s.x,a.x,0,o.y,s.y,a.y,0,o.z,s.z,a.z,0,l,u,h,1,r)},e.OrthoLH=function(t,i,n,r){var o=new e;return e.OrthoLHToRef(t,i,n,r,o),o},e.OrthoLHToRef=function(t,i,n,r,o){var s=2/t,a=2/i,c=2/(r-n),l=-(r+n)/(r-n);e.FromValuesToRef(s,0,0,0,0,a,0,0,0,0,c,0,0,0,l,1,o),o._updateIdentityStatus(1===s&&1===a&&1===c&&0===l)},e.OrthoOffCenterLH=function(t,i,n,r,o,s){var a=new e;return e.OrthoOffCenterLHToRef(t,i,n,r,o,s,a),a},e.OrthoOffCenterLHToRef=function(t,i,n,r,o,s,a){var c=2/(i-t),l=2/(r-n),u=2/(s-o),h=-(s+o)/(s-o),d=(t+i)/(t-i),f=(r+n)/(n-r);e.FromValuesToRef(c,0,0,0,0,l,0,0,0,0,u,0,d,f,h,1,a),a._markAsUpdated()},e.OrthoOffCenterRH=function(t,i,n,r,o,s){var a=new e;return e.OrthoOffCenterRHToRef(t,i,n,r,o,s,a),a},e.OrthoOffCenterRHToRef=function(t,i,n,r,o,s,a){e.OrthoOffCenterLHToRef(t,i,n,r,o,s,a),a._m[10]*=-1},e.PerspectiveLH=function(t,i,n,r){var o=new e,s=2*n/t,a=2*n/i,c=(r+n)/(r-n),l=-2*r*n/(r-n);return e.FromValuesToRef(s,0,0,0,0,a,0,0,0,0,c,1,0,0,l,0,o),o._updateIdentityStatus(!1),o},e.PerspectiveFovLH=function(t,i,n,r){var o=new e;return e.PerspectiveFovLHToRef(t,i,n,r,o),o},e.PerspectiveFovLHToRef=function(t,i,n,r,o,s){void 0===s&&(s=!0);var a=n,c=r,l=1/Math.tan(.5*t),u=s?l/i:l,h=s?l:l*i,d=(c+a)/(c-a),f=-2*c*a/(c-a);e.FromValuesToRef(u,0,0,0,0,h,0,0,0,0,d,1,0,0,f,0,o),o._updateIdentityStatus(!1)},e.PerspectiveFovRH=function(t,i,n,r){var o=new e;return e.PerspectiveFovRHToRef(t,i,n,r,o),o},e.PerspectiveFovRHToRef=function(t,i,n,r,o,s){void 0===s&&(s=!0);var a=n,c=r,l=1/Math.tan(.5*t),u=s?l/i:l,h=s?l:l*i,d=-(c+a)/(c-a),f=-2*c*a/(c-a);e.FromValuesToRef(u,0,0,0,0,h,0,0,0,0,d,-1,0,0,f,0,o),o._updateIdentityStatus(!1)},e.PerspectiveFovWebVRToRef=function(e,t,i,n,r){void 0===r&&(r=!1);var o=r?-1:1,s=Math.tan(e.upDegrees*Math.PI/180),a=Math.tan(e.downDegrees*Math.PI/180),c=Math.tan(e.leftDegrees*Math.PI/180),l=Math.tan(e.rightDegrees*Math.PI/180),u=2/(c+l),h=2/(s+a),d=n._m;d[0]=u,d[1]=d[2]=d[3]=d[4]=0,d[5]=h,d[6]=d[7]=0,d[8]=(c-l)*u*.5,d[9]=-(s-a)*h*.5,d[10]=-i/(t-i),d[11]=1*o,d[12]=d[13]=d[15]=0,d[14]=-2*i*t/(i-t),n._markAsUpdated()},e.GetFinalMatrix=function(t,i,n,r,o,s){var a=t.width,c=t.height,l=t.x,u=t.y,h=e.FromValues(a/2,0,0,0,0,-c/2,0,0,0,0,s-o,0,l+a/2,c/2+u,o,1),d=I.Matrix[0];return i.multiplyToRef(n,d),d.multiplyToRef(r,d),d.multiply(h)},e.GetAsMatrix2x2=function(e){var t=e.m;return new Float32Array([t[0],t[1],t[4],t[5]])},e.GetAsMatrix3x3=function(e){var t=e.m;return new Float32Array([t[0],t[1],t[2],t[4],t[5],t[6],t[8],t[9],t[10]])},e.Transpose=function(t){var i=new e;return e.TransposeToRef(t,i),i},e.TransposeToRef=function(e,t){var i=t._m,n=e.m;i[0]=n[0],i[1]=n[4],i[2]=n[8],i[3]=n[12],i[4]=n[1],i[5]=n[5],i[6]=n[9],i[7]=n[13],i[8]=n[2],i[9]=n[6],i[10]=n[10],i[11]=n[14],i[12]=n[3],i[13]=n[7],i[14]=n[11],i[15]=n[15],t._updateIdentityStatus(e._isIdentity,e._isIdentityDirty)},e.Reflection=function(t){var i=new e;return e.ReflectionToRef(t,i),i},e.ReflectionToRef=function(t,i){t.normalize();var n=t.normal.x,r=t.normal.y,o=t.normal.z,s=-2*n,a=-2*r,c=-2*o;e.FromValuesToRef(s*n+1,a*n,c*n,0,s*r,a*r+1,c*r,0,s*o,a*o,c*o+1,0,s*t.d,a*t.d,c*t.d,1,i)},e.FromXYZAxesToRef=function(t,i,n,r){e.FromValuesToRef(t.x,t.y,t.z,0,i.x,i.y,i.z,0,n.x,n.y,n.z,0,0,0,0,1,r)},e.FromQuaternionToRef=function(e,t){var i=e.x*e.x,n=e.y*e.y,r=e.z*e.z,o=e.x*e.y,s=e.z*e.w,a=e.z*e.x,c=e.y*e.w,l=e.y*e.z,u=e.x*e.w;t._m[0]=1-2*(n+r),t._m[1]=2*(o+s),t._m[2]=2*(a-c),t._m[3]=0,t._m[4]=2*(o-s),t._m[5]=1-2*(r+i),t._m[6]=2*(l+u),t._m[7]=0,t._m[8]=2*(a+c),t._m[9]=2*(l-u),t._m[10]=1-2*(n+i),t._m[11]=0,t._m[12]=0,t._m[13]=0,t._m[14]=0,t._m[15]=1,t._markAsUpdated()},e._updateFlagSeed=0,e._identityReadOnly=e.Identity(),e}(),m=function(){function e(e,t,i,n){this.normal=new d(e,t,i),this.d=n}return e.prototype.asArray=function(){return[this.normal.x,this.normal.y,this.normal.z,this.d]},e.prototype.clone=function(){return new e(this.normal.x,this.normal.y,this.normal.z,this.d)},e.prototype.getClassName=function(){return"Plane"},e.prototype.getHashCode=function(){var e=this.normal.getHashCode();return e=397*e^(this.d||0)},e.prototype.normalize=function(){var e=Math.sqrt(this.normal.x*this.normal.x+this.normal.y*this.normal.y+this.normal.z*this.normal.z),t=0;return 0!==e&&(t=1/e),this.normal.x*=t,this.normal.y*=t,this.normal.z*=t,this.d*=t,this},e.prototype.transform=function(t){var i=I.Matrix[0];g.TransposeToRef(t,i);var n=i.m,r=this.normal.x,o=this.normal.y,s=this.normal.z,a=this.d;return new e(r*n[0]+o*n[1]+s*n[2]+a*n[3],r*n[4]+o*n[5]+s*n[6]+a*n[7],r*n[8]+o*n[9]+s*n[10]+a*n[11],r*n[12]+o*n[13]+s*n[14]+a*n[15])},e.prototype.dotCoordinate=function(e){return this.normal.x*e.x+this.normal.y*e.y+this.normal.z*e.z+this.d},e.prototype.copyFromPoints=function(e,t,i){var n,r=t.x-e.x,o=t.y-e.y,s=t.z-e.z,a=i.x-e.x,c=i.y-e.y,l=i.z-e.z,u=o*l-s*c,h=s*a-r*l,d=r*c-o*a,f=Math.sqrt(u*u+h*h+d*d);return n=0!==f?1/f:0,this.normal.x=u*n,this.normal.y=h*n,this.normal.z=d*n,this.d=-(this.normal.x*e.x+this.normal.y*e.y+this.normal.z*e.z),this},e.prototype.isFrontFacingTo=function(e,t){return d.Dot(this.normal,e)<=t},e.prototype.signedDistanceTo=function(e){return d.Dot(e,this.normal)+this.d},e.FromArray=function(t){return new e(t[0],t[1],t[2],t[3])},e.FromPoints=function(t,i,n){var r=new e(0,0,0,0);return r.copyFromPoints(t,i,n),r},e.FromPositionAndNormal=function(t,i){var n=new e(0,0,0,0);return i.normalize(),n.normal=i,n.d=-(i.x*t.x+i.y*t.y+i.z*t.z),n},e.SignedDistanceToPlaneFromPositionAndNormal=function(e,t,i){var n=-(t.x*e.x+t.y*e.y+t.z*e.z);return d.Dot(i,t)+n},e}(),v=function(){function e(e,t,i,n){this.x=e,this.y=t,this.width=i,this.height=n}return e.prototype.toGlobal=function(t,i){return new e(this.x*t,this.y*i,this.width*t,this.height*i)},e.prototype.toGlobalToRef=function(e,t,i){return i.x=this.x*e,i.y=this.y*t,i.width=this.width*e,i.height=this.height*t,this},e.prototype.clone=function(){return new e(this.x,this.y,this.width,this.height)},e}(),y=function(){function e(){}return e.GetPlanes=function(t){for(var i=[],n=0;n<6;n++)i.push(new m(0,0,0,0));return e.GetPlanesToRef(t,i),i},e.GetNearPlaneToRef=function(e,t){var i=e.m;t.normal.x=i[3]+i[2],t.normal.y=i[7]+i[6],t.normal.z=i[11]+i[10],t.d=i[15]+i[14],t.normalize()},e.GetFarPlaneToRef=function(e,t){var i=e.m;t.normal.x=i[3]-i[2],t.normal.y=i[7]-i[6],t.normal.z=i[11]-i[10],t.d=i[15]-i[14],t.normalize()},e.GetLeftPlaneToRef=function(e,t){var i=e.m;t.normal.x=i[3]+i[0],t.normal.y=i[7]+i[4],t.normal.z=i[11]+i[8],t.d=i[15]+i[12],t.normalize()},e.GetRightPlaneToRef=function(e,t){var i=e.m;t.normal.x=i[3]-i[0],t.normal.y=i[7]-i[4],t.normal.z=i[11]-i[8],t.d=i[15]-i[12],t.normalize()},e.GetTopPlaneToRef=function(e,t){var i=e.m;t.normal.x=i[3]-i[1],t.normal.y=i[7]-i[5],t.normal.z=i[11]-i[9],t.d=i[15]-i[13],t.normalize()},e.GetBottomPlaneToRef=function(e,t){var i=e.m;t.normal.x=i[3]+i[1],t.normal.y=i[7]+i[5],t.normal.z=i[11]+i[9],t.d=i[15]+i[13],t.normalize()},e.GetPlanesToRef=function(t,i){e.GetNearPlaneToRef(t,i[0]),e.GetFarPlaneToRef(t,i[1]),e.GetLeftPlaneToRef(t,i[2]),e.GetRightPlaneToRef(t,i[3]),e.GetTopPlaneToRef(t,i[4]),e.GetBottomPlaneToRef(t,i[5])},e}();!function(e){e[e.LOCAL=0]="LOCAL",e[e.WORLD=1]="WORLD",e[e.BONE=2]="BONE"}(n||(n={}));var b,T=function(){function e(){}return e.X=new d(1,0,0),e.Y=new d(0,1,0),e.Z=new d(0,0,1),e}(),E=function(){function e(){}return e.Interpolate=function(e,t,i,n,r){for(var o=1-3*n+3*t,s=3*n-6*t,a=3*t,c=e,l=0;l<5;l++){var u=c*c;c-=(o*(u*c)+s*u+a*c-e)*(1/(3*o*u+2*s*c+a)),c=Math.min(1,Math.max(0,c))}return 3*Math.pow(1-c,2)*c*i+3*(1-c)*Math.pow(c,2)*r+Math.pow(c,3)},e}();!function(e){e[e.CW=0]="CW",e[e.CCW=1]="CCW"}(b||(b={}));var A=function(){function e(e){this._radians=e,this._radians<0&&(this._radians+=2*Math.PI)}return e.prototype.degrees=function(){return 180*this._radians/Math.PI},e.prototype.radians=function(){return this._radians},e.BetweenTwoPoints=function(t,i){var n=i.subtract(t);return new e(Math.atan2(n.y,n.x))},e.FromRadians=function(t){return new e(t)},e.FromDegrees=function(t){return new e(t*Math.PI/180)},e}(),x=function(){return function(e,t,i){this.startPoint=e,this.midPoint=t,this.endPoint=i;var n=Math.pow(t.x,2)+Math.pow(t.y,2),r=(Math.pow(e.x,2)+Math.pow(e.y,2)-n)/2,o=(n-Math.pow(i.x,2)-Math.pow(i.y,2))/2,s=(e.x-t.x)*(t.y-i.y)-(t.x-i.x)*(e.y-t.y);this.centerPoint=new h((r*(t.y-i.y)-o*(e.y-t.y))/s,((e.x-t.x)*o-(t.x-i.x)*r)/s),this.radius=this.centerPoint.subtract(this.startPoint).length(),this.startAngle=A.BetweenTwoPoints(this.centerPoint,this.startPoint);var a=this.startAngle.degrees(),c=A.BetweenTwoPoints(this.centerPoint,this.midPoint).degrees(),l=A.BetweenTwoPoints(this.centerPoint,this.endPoint).degrees();c-a>180&&(c-=360),c-a<-180&&(c+=360),l-c>180&&(l-=360),l-c<-180&&(l+=360),this.orientation=c-a<0?b.CW:b.CCW,this.angle=A.FromDegrees(this.orientation===b.CW?a-l:l-a)}}(),R=function(){function e(e,t){this._points=new Array,this._length=0,this.closed=!1,this._points.push(new h(e,t))}return e.prototype.addLineTo=function(e,t){if(this.closed)return this;var i=new h(e,t),n=this._points[this._points.length-1];return this._points.push(i),this._length+=i.subtract(n).length(),this},e.prototype.addArcTo=function(e,t,i,n,r){if(void 0===r&&(r=36),this.closed)return this;var o=this._points[this._points.length-1],s=new h(e,t),a=new h(i,n),c=new x(o,s,a),l=c.angle.radians()/r;c.orientation===b.CW&&(l*=-1);for(var u=c.startAngle.radians()+l,d=0;d<r;d++){var f=Math.cos(u)*c.radius+c.centerPoint.x,p=Math.sin(u)*c.radius+c.centerPoint.y;this.addLineTo(f,p),u+=l}return this},e.prototype.close=function(){return this.closed=!0,this},e.prototype.length=function(){var e=this._length;if(!this.closed){var t=this._points[this._points.length-1];e+=this._points[0].subtract(t).length()}return e},e.prototype.getPoints=function(){return this._points},e.prototype.getPointAtLengthPosition=function(e){if(e<0||e>1)return h.Zero();for(var t=e*this.length(),i=0,n=0;n<this._points.length;n++){var r=(n+1)%this._points.length,o=this._points[n],s=this._points[r].subtract(o),a=s.length()+i;if(t>=i&&t<=a){var c=s.normalize(),l=t-i;return new h(o.x+c.x*l,o.y+c.y*l)}i=a}return h.Zero()},e.StartingAt=function(t,i){return new e(t,i)},e}(),P=function(){function e(e,t,i){void 0===t&&(t=null),this.path=e,this._curve=new Array,this._distances=new Array,this._tangents=new Array,this._normals=new Array,this._binormals=new Array;for(var n=0;n<e.length;n++)this._curve[n]=e[n].clone();this._raw=i||!1,this._compute(t)}return e.prototype.getCurve=function(){return this._curve},e.prototype.getTangents=function(){return this._tangents},e.prototype.getNormals=function(){return this._normals},e.prototype.getBinormals=function(){return this._binormals},e.prototype.getDistances=function(){return this._distances},e.prototype.update=function(e,t){void 0===t&&(t=null);for(var i=0;i<e.length;i++)this._curve[i].x=e[i].x,this._curve[i].y=e[i].y,this._curve[i].z=e[i].z;return this._compute(t),this},e.prototype._compute=function(e){var t=this._curve.length;this._tangents[0]=this._getFirstNonNullVector(0),this._raw||this._tangents[0].normalize(),this._tangents[t-1]=this._curve[t-1].subtract(this._curve[t-2]),this._raw||this._tangents[t-1].normalize();var i,n,r,o,s=this._tangents[0],a=this._normalVector(s,e);this._normals[0]=a,this._raw||this._normals[0].normalize(),this._binormals[0]=d.Cross(s,this._normals[0]),this._raw||this._binormals[0].normalize(),this._distances[0]=0;for(var c=1;c<t;c++)i=this._getLastNonNullVector(c),c<t-1&&(n=this._getFirstNonNullVector(c),this._tangents[c]=i.add(n),this._tangents[c].normalize()),this._distances[c]=this._distances[c-1]+i.length(),r=this._tangents[c],o=this._binormals[c-1],this._normals[c]=d.Cross(o,r),this._raw||this._normals[c].normalize(),this._binormals[c]=d.Cross(r,this._normals[c]),this._raw||this._binormals[c].normalize()},e.prototype._getFirstNonNullVector=function(e){for(var t=1,i=this._curve[e+t].subtract(this._curve[e]);0===i.length()&&e+t+1<this._curve.length;)t++,i=this._curve[e+t].subtract(this._curve[e]);return i},e.prototype._getLastNonNullVector=function(e){for(var t=1,i=this._curve[e].subtract(this._curve[e-t]);0===i.length()&&e>t+1;)t++,i=this._curve[e].subtract(this._curve[e-t]);return i},e.prototype._normalVector=function(e,t){var i,n,r=e.length();(0===r&&(r=1),null==t)?(n=o.a.WithinEpsilon(Math.abs(e.y)/r,1,c)?o.a.WithinEpsilon(Math.abs(e.x)/r,1,c)?o.a.WithinEpsilon(Math.abs(e.z)/r,1,c)?d.Zero():new d(0,0,1):new d(1,0,0):new d(0,-1,0),i=d.Cross(e,n)):(i=d.Cross(e,t),d.CrossToRef(i,e,i));return i.normalize(),i},e}(),S=function(){function e(e){this._length=0,this._points=e,this._length=this._computeLength(e)}return e.CreateQuadraticBezier=function(t,i,n,r){r=r>2?r:3;for(var o=new Array,s=function(e,t,i,n){return(1-e)*(1-e)*t+2*e*(1-e)*i+e*e*n},a=0;a<=r;a++)o.push(new d(s(a/r,t.x,i.x,n.x),s(a/r,t.y,i.y,n.y),s(a/r,t.z,i.z,n.z)));return new e(o)},e.CreateCubicBezier=function(t,i,n,r,o){o=o>3?o:4;for(var s=new Array,a=function(e,t,i,n,r){return(1-e)*(1-e)*(1-e)*t+3*e*(1-e)*(1-e)*i+3*e*e*(1-e)*n+e*e*e*r},c=0;c<=o;c++)s.push(new d(a(c/o,t.x,i.x,n.x,r.x),a(c/o,t.y,i.y,n.y,r.y),a(c/o,t.z,i.z,n.z,r.z)));return new e(s)},e.CreateHermiteSpline=function(t,i,n,r,o){for(var s=new Array,a=1/o,c=0;c<=o;c++)s.push(d.Hermite(t,i,n,r,c*a));return new e(s)},e.CreateCatmullRomSpline=function(t,i,n){var r=new Array,o=1/i,s=0;if(n){for(var a=t.length,c=0;c<a;c++){s=0;for(var l=0;l<i;l++)r.push(d.CatmullRom(t[c%a],t[(c+1)%a],t[(c+2)%a],t[(c+3)%a],s)),s+=o}r.push(r[0])}else{var u=new Array;u.push(t[0].clone()),Array.prototype.push.apply(u,t),u.push(t[t.length-1].clone());for(c=0;c<u.length-3;c++){s=0;for(l=0;l<i;l++)r.push(d.CatmullRom(u[c],u[c+1],u[c+2],u[c+3],s)),s+=o}c--,r.push(d.CatmullRom(u[c],u[c+1],u[c+2],u[c+3],s))}return new e(r)},e.prototype.getPoints=function(){return this._points},e.prototype.length=function(){return this._length},e.prototype.continue=function(t){for(var i=this._points[this._points.length-1],n=this._points.slice(),r=t.getPoints(),o=1;o<r.length;o++)n.push(r[o].subtract(r[0]).add(i));return new e(n)},e.prototype._computeLength=function(e){for(var t=0,i=1;i<e.length;i++)t+=e[i].subtract(e[i-1]).length();return t},e}(),C=function(){function e(e,t){void 0===e&&(e=d.Zero()),void 0===t&&(t=d.Up()),this.position=e,this.normal=t}return e.prototype.clone=function(){return new e(this.position.clone(),this.normal.clone())},e}(),M=function(){function e(e,t,i){void 0===e&&(e=d.Zero()),void 0===t&&(t=d.Up()),void 0===i&&(i=h.Zero()),this.position=e,this.normal=t,this.uv=i}return e.prototype.clone=function(){return new e(this.position.clone(),this.normal.clone(),this.uv.clone())},e}(),O=function(){function e(){}return e.Color3=r.a.BuildArray(3,l.Black),e.Color4=r.a.BuildArray(3,function(){return new u(0,0,0,0)}),e.Vector2=r.a.BuildArray(3,h.Zero),e.Vector3=r.a.BuildArray(13,d.Zero),e.Vector4=r.a.BuildArray(3,f.Zero),e.Quaternion=r.a.BuildArray(2,_.Zero),e.Matrix=r.a.BuildArray(8,g.Identity),e}(),I=function(){function e(){}return e.Vector3=r.a.BuildArray(6,d.Zero),e.Matrix=r.a.BuildArray(2,g.Identity),e.Quaternion=r.a.BuildArray(3,_.Zero),e}()},function(e,t,i){"use strict";i.d(t,"d",function(){return r}),i.d(t,"a",function(){return o}),i.d(t,"c",function(){return s}),i.d(t,"b",function(){return a}),i.d(t,"e",function(){return c});
/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */