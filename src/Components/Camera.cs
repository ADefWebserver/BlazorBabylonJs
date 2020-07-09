using BabylonBlazor.Extensions;
using System;
using System.Numerics;
using System.Threading.Tasks;

namespace BabylonBlazor.Components
{
	public abstract class Camera
	{
		public string Name { get; }
		public Vector3 Direction { get; set; }
		public Scene Scene { get; }
		public CameraTypes CameraType { get; }
		public Camera(Scene scene, CameraTypes type, string name, Vector3? direction = null)
		{
			Scene = scene ?? throw new ArgumentNullException(nameof(scene));
			CameraType = type;
			Name = name;
			Direction = direction ?? new Vector3(0, 1, 0);
		}
		public async Task Build()
		{
			await Scene.JSRuntime.CreateCamera(Scene.Engine.Canvas.ID, Name);
		}
	}
	public enum CameraTypes
	{
		FreeCamera
	}
	public class FreeCamera : Camera
	{
		public FreeCamera(Scene scene, string name, Vector3 direction = default) : base(scene, CameraTypes.FreeCamera, name, direction) { }
	}

}

