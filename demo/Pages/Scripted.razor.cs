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
		Canvas canvas = null;
		Scene scene;
		protected override async Task OnAfterRenderAsync(bool firstRender)
		{
			if (firstRender)
			{
				var engine = canvas.GetEngine();
				scene = await engine.WithDefaultScene().Build();
				await scene.Render();

				// you can add more things at any time
				await scene.AddPrimitive(
					PrimitiveTypes.Sphere,
					"sphere2",
					new { diameter = 3, segments = 16 },
					new Vector3(1, 1, 1),
					new Vector3(1, 0.5f, 0.5f)
					);

				await scene.AddLight(LightTypes.HemisphericLight,
					"light2",
					new Vector3(1, 1, 1),
					0.8,
					new Vector3(1, 0, 0)
					);
				StateHasChanged();
			}
		}
		async Task AddSphere()
		{
			Random rng = new Random();
			var primos = 1 + (scene.Primitives.Count / 5);

			await scene.AddPrimitive(
				PrimitiveTypes.Sphere,
				DateTime.Now.Ticks.ToString(),
				new { diameter = rng.Next(1, 4), segments = 8 * rng.Next(1, 8) },
				new Vector3(rng.Next(-primos, primos), rng.Next(1, 2 * primos), rng.Next(-primos, primos)),
				new Vector3((float)rng.NextDouble(), (float)rng.NextDouble(), (float)rng.NextDouble())
			);

		}
	}
}