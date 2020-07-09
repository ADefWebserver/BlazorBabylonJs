using BabylonBlazor.Extensions;
using System;
using System.Diagnostics;
using System.Numerics;
using System.Threading.Tasks;

namespace BabylonBlazor.Components
{
	[DebuggerDisplay("{" + nameof(GetDebuggerDisplay) + "(),nq}")]
	public class Primitive
	{
		public string Name { get; }
		public object Options { get; }
		public Vector3 Position { get; }
		public Vector3? Specular { get; }
		public Scene Scene { get; }
		public PrimitiveTypes PrimitiveType { get; }
		public Primitive(Scene scene, PrimitiveTypes type, string name, object options, Vector3? position=null, Vector3? specular=null)
		{
			Scene = scene ?? throw new ArgumentNullException(nameof(scene));
			PrimitiveType = type;
			Name = name;
			Options = options;
			Position = position ?? default;
			Specular = specular;
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
					Position,
					Specular
					);
		}
		string GetDebuggerDisplay() => $"{nameof(PrimitiveType)} : {PrimitiveType}, {nameof(Name)} = {Name}";
	}
	public enum PrimitiveTypes
	{
		Ground,
		Sphere
	}
	public class PrimitiveSphere : Primitive
	{
		public PrimitiveSphere(Scene scene, string name, object options, Vector3? position = null, Vector3? specular = null) : base(scene, PrimitiveTypes.Sphere, name, options, position, specular) { }
	}

	public class PrimitiveGround : Primitive
	{
		public PrimitiveGround(Scene scene, string name, object options, Vector3? position, Vector3? specular = null) : base(scene, PrimitiveTypes.Ground, name, options, position,specular) { }
	}

}

