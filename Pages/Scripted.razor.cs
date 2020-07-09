using BabylonBlazor.Components;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System;
using System.Collections.Generic;
using System.Linq;
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
			}
		}
	}
}