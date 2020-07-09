using Microsoft.AspNetCore.Components;

namespace BabylonBlazor.Interfaces
{
	public interface IBBFragment
	{
		string ID { get; }

		RenderFragment GetRenderFragment();
		
	}
}