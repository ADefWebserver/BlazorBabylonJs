using BabylonBlazor.Interfaces;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Rendering;
using Microsoft.JSInterop;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading.Tasks;

namespace BabylonBlazor.Components
{
	[DebuggerDisplay("{" + nameof(GetDebuggerDisplay) + "(),nq}")]
	public class Canvas : ComponentBase, IBBFragment
	{
		[Parameter]
		public string ID { get; set; }

		[Parameter(CaptureUnmatchedValues = true)]
		public IReadOnlyDictionary<string, object> AdditionalAttributes { get; set; }
		
		[Inject] IJSRuntime JS { get; set; }

		private Engine _engine { get; set; }

		public Canvas() : this(Guid.NewGuid().ToString("N")) { }
		public Canvas(string id)
		{
			ID = id;
		}

		public Engine GetEngine()
		{
			if (_engine is null)
			{
				_engine = new Engine(JS, this);
			}
			return _engine;
		}

		protected override void BuildRenderTree(RenderTreeBuilder builder)
		{
			builder.AddContent(0, GetRenderFragment());
		}
		public RenderFragment GetRenderFragment()
		{
			return builder =>
			{
				builder.OpenElement(0, "canvas");
				builder.AddAttribute(1, "id", ID);
				builder.AddAttribute(2, "touch-action", "none");
				builder.AddMultipleAttributes(3, AdditionalAttributes);
				builder.CloseElement();
			};
		}

		string GetDebuggerDisplay() => $"{GetType().Name} : {nameof(ID)} = {ID}";

		public static implicit operator RenderFragment(Canvas canvas)
			=> canvas.GetRenderFragment();

	}
}