using BabylonBlazor.Extensions;
using System;
using System.Numerics;
using System.Threading.Tasks;

namespace BabylonBlazor.Components
{
	public class Primitive
	{
		public string Name { get; }
		public object Options { get; }
		public Vector3 Position { get; }
		public Scene Scene { get; }
		public PrimitiveTypes PrimitiveType { get; }
		public Primitive(Scene scene, PrimitiveTypes type, string name, object options, Vector3? position)
		{
			Scene = scene ?? throw new ArgumentNullException(nameof(scene));
			PrimitiveType = type;
			Name = name;
			Options = options;
			Position = position ?? default;
		}
		public async Task Build()
		{
			//TODO: Consider how to handle options - this is just for POC 😀
			await Scene
				.JSRuntime
				.CreatePrimitive(Scene.Engine.Canvas.ID,
					PrimitiveType,
					Name,
					Options,
					Position
					);
		}
	}
	public enum PrimitiveTypes
	{
		Ground,
		Sphere
	}
	public class PrimitiveSphere : Primitive
	{
		public PrimitiveSphere(Scene scene, string name, object options, Vector3? position) : base(scene, PrimitiveTypes.Sphere, name, options, position) { }
	}

	public class PrimitiveGround : Primitive
	{
		public PrimitiveGround(Scene scene, string name, object options, Vector3? position) : base(scene, PrimitiveTypes.Ground, name, options, position) { }
	}

}

