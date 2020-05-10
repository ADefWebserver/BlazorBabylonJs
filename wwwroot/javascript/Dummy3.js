(function () {
    var engine;
    var scene;
    var idleAnim;
    var walkAnim;
    var runAnim;

    window.Dummy3 = {
        showUI: function () {
            engine.displayLoadingUI();
        },
        hideUI: function () {
            engine.hideLoadingUI();
        },
        idleBabylon: function () {
            idleAnim._slider.value = 1.0;
            walkAnim._slider.value = 0.0;
            runAnim._slider.value = 0.0;
            // Synchronize animations
            idleAnim.syncWith(null);
            walkAnim.syncWith(idleAnim);
        },
        walkBabylon: function () {
            idleAnim._slider.value = 0.0;
            walkAnim._slider.value = 1.0;
            runAnim._slider.value = 0.0;
            // Synchronize animations
            walkAnim.syncWith(null);
            idleAnim.syncWith(walkAnim);
        },
        runBabylon: function () {
            walkAnim._slider.value = 0.0;
            idleAnim._slider.value = 0.0;
            runAnim._slider.value = 1.0;
            // Synchronize animations
            walkAnim.syncWith(runAnim);
        },
        showBabylon: function (canvas) {
            var sceneToRender = null;
            var createDefaultEngine = function () { return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true }); };
            var delayCreateScene = function () {

                // Model by Mixamo

                engine.enableOfflineSupport = false;
                BABYLON.Animation.AllowMatricesInterpolation = true;
                scene = new BABYLON.Scene(engine);

                var camera = new BABYLON.ArcRotateCamera("camera1", Math.PI / 2, Math.PI / 4, 3, new BABYLON.Vector3(0, 1, 0), scene);
                camera.attachControl(canvas, true);

                camera.lowerRadiusLimit = 2;
                camera.upperRadiusLimit = 10;
                camera.wheelDeltaPercentage = 0.01;

                var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
                light.intensity = 0.6;
                light.specular = BABYLON.Color3.Black();

                var light2 = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(0, -0.5, -1.0), scene);
                light2.position = new BABYLON.Vector3(0, 5, 5);

                // Shadows
                var shadowGenerator = new BABYLON.ShadowGenerator(1024, light2);
                shadowGenerator.useBlurExponentialShadowMap = true;
                shadowGenerator.blurKernel = 32;

                engine.displayLoadingUI();

                BABYLON.SceneLoader.ImportMesh("", "./scenes/", "dummy3.babylon.json", scene, function (newMeshes, particleSystems, skeletons) {
                    var skeleton = skeletons[0];

                    shadowGenerator.addShadowCaster(scene.meshes[0], true);
                    for (var index = 0; index < newMeshes.length; index++) {
                        newMeshes[index].receiveShadows = false;;
                    }

                    var helper = scene.createDefaultEnvironment({
                        enableGroundShadow: true
                    });
                    helper.setMainColor(BABYLON.Color3.Gray());
                    helper.ground.position.y += 0.01;

                    var idleRange = skeleton.getAnimationRange("YBot_Idle");
                    var walkRange = skeleton.getAnimationRange("YBot_Walk");
                    var runRange = skeleton.getAnimationRange("YBot_Run");
                    idleAnim = scene.beginWeightedAnimation(skeleton, idleRange.from, idleRange.to, 1.0, true);
                    walkAnim = scene.beginWeightedAnimation(skeleton, walkRange.from, walkRange.to, 0, true);
                    runAnim = scene.beginWeightedAnimation(skeleton, runRange.from, runRange.to, 0, true);

                    var params = [
                        { name: "Idle", anim: idleAnim },
                        { name: "Walk", anim: walkAnim },
                        { name: "Run", anim: runAnim }
                    ]

                    params.forEach((param) => {
                        var slider = new BABYLON.GUI.Slider();
                        slider.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                        slider.minimum = 0;
                        slider.maximum = 1;
                        slider.color = "green";
                        slider.value = param.anim.weight;
                        slider.height = "20px";
                        slider.width = "205px";
                        slider.onValueChangedObservable.add((v) => {
                            param.anim.weight = v;
                        })
                        param.anim._slider = slider;
                    });

                    engine.hideLoadingUI();

                }, function (evt) {
                });

                return scene;

            };

            engine = createDefaultEngine();
            if (!engine) throw 'engine should not be null.';
            scene = delayCreateScene();;
            sceneToRender = scene

            engine.runRenderLoop(function () {
                if (sceneToRender) {
                    sceneToRender.render();
                }
            });

            // Watch for browser/canvas resize events
            window.addEventListener("resize", function () {
                engine.resize();
            });
        }
    };
})();