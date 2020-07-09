using BabylonBlazor.Components;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Text;
using System.Threading.Tasks;

namespace BlazorBabylonJs.Pages
{
	public partial class Scripted
	{
		[Inject] IJSRuntime JS { get; set; }
		Canvas canvas;

		protected override async Task OnAfterRenderAsync(bool firstRender)
		{
			if (firstRender)
			{
				var engine = canvas.GetEngine();
				var scene = await engine.WithDefaultScene().Build();
				await scene.Render();
				// you can add more things at any time
				_ = await scene.AddPrimitive(
					PrimitiveTypes.Sphere,
					"sphere2",
					new { diameter=3, segments=16 },
					new Vector3(1,1,1)
					);
				_ = await scene.AddLight(LightTypes.HemisphericLight,
					"light2",
					new Vector3(1,1,1),
					0.8,
					new Vector3(255,100,100)
					);
			}
		}
	}
}