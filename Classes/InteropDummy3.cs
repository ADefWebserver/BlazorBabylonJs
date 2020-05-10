using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System.Threading.Tasks;

namespace BlazorBabylonJs
{
    public static class InteropDummy3
    {
        internal static ValueTask ShowBabylon(
            IJSRuntime jsRuntime, 
            ElementReference CanvasElement)
        {
            return jsRuntime.InvokeVoidAsync(
            "Dummy3.showBabylon",
            CanvasElement);
        }

        internal static ValueTask Show(
            IJSRuntime jsRuntime)
        {
            return jsRuntime.InvokeVoidAsync(
            "Dummy3.showUI",
            null);
        }

        internal static ValueTask Hide(
            IJSRuntime jsRuntime)
        {
            return jsRuntime.InvokeVoidAsync(
            "Dummy3.hideUI",
            null);
        }

        internal static ValueTask Idle(
            IJSRuntime jsRuntime)
        {
            return jsRuntime.InvokeVoidAsync(
            "Dummy3.idleBabylon",
            null);
        }

        internal static ValueTask Walk(
            IJSRuntime jsRuntime)
        {
            return jsRuntime.InvokeVoidAsync(
            "Dummy3.walkBabylon",
            null);
        }

        internal static ValueTask Run(
            IJSRuntime jsRuntime)
        {
            return jsRuntime.InvokeVoidAsync(
            "Dummy3.runBabylon",
            null);
        }
    }
}