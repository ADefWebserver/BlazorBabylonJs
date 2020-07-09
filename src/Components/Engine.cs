using BabylonBlazor.Extensions;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Rendering;
using Microsoft.JSInterop;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BabylonBlazor.Components
{
	/// <summary>
	/// C# Wrapper for BabylonJS 
	/// </summary>
	public class Engine
	{
		internal IJSRuntime JSRuntime { get; }
		internal Canvas Canvas { get; }
		private bool AntiAlias { get; }
		public Scene DefaultScene { get; private set; }

		public Engine(IJSRuntime jSRuntime, Canvas canvas, bool antiAlias = false)
		{
			JSRuntime = jSRuntime ?? throw new ArgumentNullException(nameof(JSRuntime));
			Canvas = canvas;
			AntiAlias = antiAlias;
		}
		public Engine WithDefaultScene()
		{
			AddDefaultScene();
			return this;
		}

		private void AddDefaultScene()
		{
			if (DefaultScene is null)
			{
				DefaultScene = new Scene(this).WithDefaults();
			}
		}

		public async Task<Scene> Build()
		{
			await JSRuntime.CreateEngine(Canvas.ID, AntiAlias);
			if (DefaultScene is object)
			{
				return await DefaultScene.Build();
			}

			return null;
		}

	}
}
