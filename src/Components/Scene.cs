using BabylonBlazor.Extensions;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Rendering;
using Microsoft.Extensions.Options;
using Microsoft.JSInterop;
using System;
using System.Collections.Generic;
using System.Numerics;
using System.Threading.Tasks;

namespace BabylonBlazor.Components
{
	/// <summary>
	/// C# Wrapper for BabylonJS 
	/// </summary>
	public class Scene
	{
		internal IJSRuntime JSRuntime { get; }
		internal Engine Engine { get; }
		public List<Light> Lights { get; set; }
		public List<Camera> Cameras { get; set; }
		public List<Primitive> Primitives { get; set; }
		public bool IsReady { get; private set; }

		public Scene(Engine engine)
		{
			Engine = engine ?? throw new ArgumentNullException(nameof(engine));
			JSRuntime = engine.JSRuntime;
		}
		public Scene WithDefaults()
		{
			Lights = new List<Light>();
			AddDefaultLight();
			Cameras = new List<Camera>();
			AddDefaultCamera();
			Primitives = new List<Primitive>();
			AddDefaultPrimitives();
			return this;
		}

		public async Task<Light> AddLight(LightTypes lightType, string name,Vector3 direction,double intensity,Vector3 specular)
		{
			var item = new Light(this,lightType,name,direction,intensity,specular);
			Lights.Add(item);
			if (IsReady)
			{
				await item.Build();
			}
			return item;
		}
		private void AddDefaultLight()
		{
			Lights.Add(
				new HemisphericLight(this, "defaultLight")
				{
					Specular = new Vector3(0,0,1)
				}
			);
		}
		private void AddDefaultCamera()
		{
			Cameras.Add(new FreeCamera(this, "defaultCamera"));
		}
		public async Task<Primitive> AddPrimitive(PrimitiveTypes primitiveType, string name, object options, Vector3 position, Vector3? specular)
		{
			Primitive item = new Primitive(this, primitiveType, name, options, position, specular);
			Primitives.Add(item);
			if (IsReady)
			{
				await item.Build();
			}
			return item;
		}
		private void AddDefaultPrimitives()
		{
			//TODO: Do something about these Vector3 objects - need a helper of some kind to hide them
			Primitives.Add(
				new PrimitiveSphere(this, 
					name:"defaultSphere",
					options:new { 
						diameter = 2, segments = 32,
						position = new{ x = 0, y = 1, z = 0 }
					},
					new Vector3(0,1,0),
					new Vector3(0,1,1) //Yellow
					)
				);

			Primitives.Add(
				new PrimitiveGround(this,
					name: "defaultGround",
					options:new { width = 500, height = 500 },
					default,
					new Vector3(0.33f,0.5f,0.30f) // Green
					)
				);
		}
		public Scene WithLights(IEnumerable<Light> lights)
		{
			Lights.AddRange(lights);
			return this;
		}
		public Scene WithCameras(IEnumerable<Camera> cameras)
		{
			Cameras.AddRange(cameras);
			return this;
		}
		public Scene WithPrimitives(IEnumerable<Primitive> primitives)
		{
			Primitives.AddRange(primitives);
			return this;
		}
		public async Task<Scene> Build()
		{
			if (!IsReady)
			{
				await JSRuntime.CreateScene(Engine.Canvas.ID);
				Lights?.ForEach(async light => await light.Build());
				Cameras?.ForEach(async camera => await camera.Build());
				Primitives?.ForEach(async primitive => await primitive.Build());
				IsReady = true;
			}
			return this;
		}
		public async Task<Scene> Render()
		{
			if (IsReady)
			{
				await JSRuntime.RenderScene(Engine.Canvas.ID);
			}
			return this;
		}
	}
}
