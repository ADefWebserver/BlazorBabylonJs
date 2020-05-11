/*
 * There are still harcoded parts here that need to come out as components
 * e.g. <BabylonLight Style="HemisphericLight" Name="light1" etc.../>
 *      <BabylonCamera Style="ArcRotateCamera" Name="camera1" etc.../>
 * 
 */
function prepareStage(e) {
    e.detail.stage.setupCameras = function (stage) {
        const Babylon = stage.babylon;
        const scene = stage.scene;
        const canvas = stage.canvas;
        const camera = new Babylon.ArcRotateCamera("camera1", Math.PI / 2, Math.PI / 4, 3, new Babylon.Vector3(0, 1, 0), scene);
        camera.lowerRadiusLimit = 2;
        camera.upperRadiusLimit = 10;
        camera.wheelDeltaPercentage = 0.01;
        camera.attachControl(canvas, true);
        return [camera];
    };
    e.detail.stage.setupEngine = function (stage) {
        const Babylon = stage.babylon;
        const engine = new Babylon.Engine(stage.canvas, true);
        engine.enableOfflineSupport = false;
        Babylon.Animation.AllowMatricesInterpolation = true;
        return engine;
    };
    e.detail.stage.setupLights = function (stage) {
        const scene = stage.scene;
        const Babylon = stage.babylon;
        const light = new Babylon.HemisphericLight("light1", new Babylon.Vector3(0, 1, 0), scene);
        light.intensity = 0.6;
        light.specular = Babylon.Color3.Black();

        const light2 = new Babylon.DirectionalLight("dir01", new Babylon.Vector3(0, -0.5, -1.0), scene);
        light2.position = new Babylon.Vector3(0, 5, 5);
        return [light, light2];
    };
    // resume setup from the paused state by calling **init**
    e.target.init();
};

/*
 * There are still harcoded parts here that need to come out as components
 * e.g. <BabylonShadow Lights="Light1"  etc.../>
 *      <BabylonMeshImport Name="dummy3" Source="dummy3.babylon.json" etc.../>
 *
 */

function prepareScene(e, mainColor) {
    const scene = e.detail.scene;
    const Babylon = e.detail.babylon;
    const lights = e.detail.lights;
    const engine = e.detail.engine;

    engine.displayLoadingUI();

    // Shadows
    var shadowGenerator = new Babylon.ShadowGenerator(1024, lights[1]);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;

    Babylon.SceneLoader.ImportMesh("", "./scenes/", "dummy3.babylon.json", scene, function (newMeshes, particleSystems, skeletons) {
        var skeleton = skeletons[0];

        shadowGenerator.addShadowCaster(scene.meshes[0], true);
        for (var index = 0; index < newMeshes.length; index++) {
            newMeshes[index].receiveShadows = false;;
        }

        var helper = scene.createDefaultEnvironment({
            enableGroundShadow: true
        });
        helper.setMainColor(mainColor ?? Babylon.Color3.Gray());
        helper.ground.position.y += 0.01;

        var idleRange = skeleton.getAnimationRange("YBot_Idle");
        var walkRange = skeleton.getAnimationRange("YBot_Walk");
        var runRange = skeleton.getAnimationRange("YBot_Run");
        thisAnim = scene.beginWeightedAnimation(skeleton, idleRange.from, idleRange.to, 1.0, true);
        walkAnim = scene.beginWeightedAnimation(skeleton, walkRange.from, walkRange.to, 0, true);
        runAnim = scene.beginWeightedAnimation(skeleton, runRange.from, runRange.to, 0, true);
        var params = [
            { name: "Idle", anim: thisAnim },
            { name: "Walk", anim: walkAnim },
            { name: "Run", anim: runAnim }
        ]

        window.anims = window.anims || [];
        window.anims[e.target.id] = params;

        engine.hideLoadingUI();

    }, function (evt) {
    });
}

/*
 * There is still work to be done but this generic animation weight setter works as a start
 * but it relies (for now) on window.anims which is an object created in the prepareScene above
 * and so it specific to this demo for now
 */
function setAnimation(id, name, weight) {
    const anims = window.anims[id];
    var thisAnim;
    anims.forEach((anim) => {
        switch (anim.name) {
            case name:
                thisAnim = anim.anim;
                thisAnim.weight = weight;
                thisAnim.syncWith(null);
                break;
            default:
                otherAnim = anim.anim;
                otherAnim.syncWith(thisAnim);
                otherAnim.weight = 0.0;
        }
    });
}
