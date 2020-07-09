using BabylonBlazor.Extensions;
using System;
using System.Diagnostics;
using System.Numerics;
using System.Threading.Tasks;

namespace BabylonBlazor.Components
{
	[DebuggerDisplay("{" + nameof(GetDebuggerDisplay) + "(),nq}")]
	public class Light
	{
		public string Name { get; }
		public Vector3 Direction { get; set; }
		public double Intensity { get; set; }
		public Vector3 Specular { get; set; }
		public Scene Scene { get; }
		public LightTypes LightType { get; }
		public Light(Scene scene, LightTypes type, string name, Vector3? direction = null, double intensity = 0.3, Vector3? specular = null)
		{
			Scene = scene ?? throw new ArgumentNullException(nameof(scene));
			LightType = type;
			Name = name;
			Direction = direction ?? new Vector3(0, 1, 0);
			Intensity = intensity;
			Specular = specular ?? new Vector3(1, 1, 1);
		}
		public async Task Build()
		{
			await Scene.JSRuntime.CreateLight(Scene.Engine.Canvas.ID, LightType, Name, Direction, Intensity, Specular);
		}
		string GetDebuggerDisplay() => $"{nameof(LightType)} : {LightType}, {nameof(Name)} : {Name}";
	}
	public enum LightTypes
	{
		HemisphericLight
	}
	public class HemisphericLight : Light
	{
		public HemisphericLight(Scene scene, string name, Vector3? direction = null) : base(scene, LightTypes.HemisphericLight, name, direction) { }
	}

}

/*new Babylon.HemisphericLight("light1", new Babylon.Vector3(0, 1, 0), scene);
        light.intensity = 0.6;
        light.specular = Babylon.Color3.Black();*/
