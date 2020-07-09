'use strict';

window.BabylonBlazor = {
    engines: [],
    scenes: [],
    CreateEngine: function (canvasID, antialias) {
        var canvas = document.getElementById(canvasID)
        if (canvas) {

            var engine = new BABYLON.Engine(canvas, antialias)

            // Review: these could be configurable
            engine.enableOfflineSupport = false
            BABYLON.Animation.AllowMatricesInterpolation = true

            // Watch for browser/canvas resize events
            window.addEventListener("resize", function () {
                engine.resize();
            });

            this.engines[canvasID] = engine
            return true
        }
        return false
    },
    CreateScene: function (canvasID) {
        var engine = this.engines[canvasID]
        if (engine) {

            var scene = new BABYLON.Scene(engine)

            this.scenes[canvasID] = scene
            return true
        }
        return false
    },
    RenderScene: function (canvasID) {
        var engine = this.engines[canvasID]
        var scene = this.scenes[canvasID]
        if (scene) {

            engine.runRenderLoop(function () {
                scene.render();
            });

            return true
        }
        return false
    },
    CreateLight: function (canvasID, lightType, name, direction, intensity, specular) {
        var scene = this.scenes[canvasID]
        if (scene) {
            switch (lightType) {
                case "HemisphericLight":
                    const aimAt = new BABYLON.Vector3(direction.x, direction.y, direction.z)
                    var light = new BABYLON.HemisphericLight(name, aimAt, scene)
                    break
                default:
            }
            if (light) {
                light.intensity = intensity
                light.specular = new BABYLON.Color3(specular.r, specular.g, specular.b)
                return true
            }
        }
        return false
    },
    CreateCamera: function (canvasID, name) {
        //TODO: more options, remove hard coded vector
        var scene = this.scenes[canvasID]
        var canvas = document.getElementById(canvasID)
        if (scene) {

            var camera = new BABYLON.FreeCamera(name, new BABYLON.Vector3(0, 5, -10), scene)

            camera.setTarget(BABYLON.Vector3.Zero())

            camera.attachControl(canvas, true)

            return true
        }
        return false
    },
    CreatePrimitive: function (canvasID, primitiveType, name, options, position, specular) {
        var scene = this.scenes[canvasID]
        if (scene) {
            switch (primitiveType) {
                case "Sphere":
                    //{ diameter: 2, segments: 32 }
                    // Move the sphere upward 1/2 its height
                    // sphere.position.y = 1
                    var mesh = BABYLON.MeshBuilder.CreateSphere(name, options, scene)
                    break
                case "Ground":
                    // { width: 6, height: 6 }
                    var mesh = BABYLON.MeshBuilder.CreateGround(name, options, scene)
                    break
                default:
            }
            if (mesh) {
                if (position) {
                    mesh.position.x = position.x
                    mesh.position.y = position.y
                    mesh.position.z = position.z
                }
                if (specular) {
                    var material = new BABYLON.StandardMaterial(`texture-${name}`, scene);
                    material.diffuseColor = new BABYLON.Color3(specular.r, specular.g, specular.b)
                    mesh.material = material;
                }
                return true
            }
        }
        return false
    }
}