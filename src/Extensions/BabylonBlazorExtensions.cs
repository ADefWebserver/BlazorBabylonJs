using BabylonBlazor.Components;
using Microsoft.JSInterop;
using System;
using System.Collections.Generic;
using System.Numerics;
using System.Text;
using System.Threading.Tasks;

namespace BabylonBlazor.Extensions
{
	internal static class BabylonBlazorExtensions
	{
		public static async Task<bool> CreateEngine(this IJSRuntime JS, string CanvasID, bool AntiAlias)
		{
			return await JS.InvokeAsync<bool>($"{nameof(BabylonBlazor)}.{nameof(CreateEngine)}",
				CanvasID,
				AntiAlias);
		}

		public static async Task<bool> CreateScene(this IJSRuntime JS, string CanvasID)
		{
			return await JS.InvokeAsync<bool>($"{nameof(BabylonBlazor)}.{nameof(CreateScene)}",
				CanvasID);
		}

		public static async Task<bool> RenderScene(this IJSRuntime JS, string CanvasID)
		{
			return await JS.InvokeAsync<bool>($"{nameof(BabylonBlazor)}.{nameof(RenderScene)}",
				CanvasID);
		}

		public static async Task<bool> CreateLight(this IJSRuntime JS,
			string CanvasID,
			LightTypes LightType,
			string Name,
			Vector3 Direction,
			double Intensity,
			Vector3 Specular
			)
		{
			//TODO: Enums suck here - fix it
			return await JS.InvokeAsync<bool>($"{nameof(BabylonBlazor)}.{nameof(CreateLight)}",
				CanvasID,
				Enum.GetName(typeof(LightTypes), LightType),
				Name,
				new {X = Direction.X, Y = Direction.Y, Z = Direction.Z },
				Intensity,
				new {R = Specular.X, G = Specular.Y, B = Specular.Z }
				);
		}

		public static async Task<bool> CreateCamera(this IJSRuntime JS, string CanvasID, string Name)
		{
			//TODO: More options
			return await JS.InvokeAsync<bool>($"{nameof(BabylonBlazor)}.{nameof(CreateCamera)}",
				CanvasID,
				Name);
		}

		public static async Task<bool> CreatePrimitive(this IJSRuntime JS,
			string CanvasID,
			PrimitiveTypes PrimitiveType,
			string Name,
			object options,
			Vector3 Position,
			Vector3? Specular=null
			)
		{
			//TODO: Enums suck here - fix it
			return await JS.InvokeAsync<bool>($"{nameof(BabylonBlazor)}.{nameof(CreatePrimitive)}",
				CanvasID,
				Enum.GetName(typeof(PrimitiveTypes), PrimitiveType),
				Name,
				options,
				new {Position.X,Position.Y,Position.Z},
				Specular.HasValue ? new { R = Specular.Value.X, G = Specular.Value.Y, B = Specular.Value.Z } : null
				);
		}
	}
}

