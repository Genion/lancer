import ExpoModulesCore

public class LancerTerminalModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LancerTerminalSurface")

    // Bumped when native hardware-keyboard handling changes; surfaced in the JS debug
    // logs so a stale native binary is distinguishable from a broken key pipeline.
    Constants([
      "hardwareKeyRevision": 3,
      "outputRevision": 1,
    ])

    View(LancerTerminalView.self) {
      AsyncFunction("writeOutput") { (view: LancerTerminalView, data: String, reset: Bool) in
        view.writeOutput(data, reset: reset)
      }

      AsyncFunction("resetInput") { (view: LancerTerminalView) in
        view.resetInputField()
      }

      Prop("terminalKey") { (view: LancerTerminalView, terminalKey: String) in
        view.terminalKey = terminalKey
      }

      Prop("initialBuffer") { (view: LancerTerminalView, initialBuffer: String) in
        view.initialBuffer = initialBuffer
      }

      Prop("fontSize") { (view: LancerTerminalView, fontSize: Double) in
        view.fontSize = CGFloat(fontSize)
      }

      Prop("focusRequest") { (view: LancerTerminalView, focusRequest: Double) in
        view.focusRequest = focusRequest
      }

      Prop("readOnly") { (view: LancerTerminalView, readOnly: Bool) in
        view.readOnly = readOnly
      }

      Prop("autoFocus") { (view: LancerTerminalView, autoFocus: Bool) in
        view.autoFocus = autoFocus
      }

      Prop("appearanceScheme") { (view: LancerTerminalView, appearanceScheme: String) in
        view.appearanceScheme = appearanceScheme
      }

      Prop("themeConfig") { (view: LancerTerminalView, themeConfig: String) in
        view.themeConfig = themeConfig
      }

      Prop("backgroundColor") { (view: LancerTerminalView, backgroundColor: String) in
        view.backgroundColorHex = backgroundColor
      }

      Prop("foregroundColor") { (view: LancerTerminalView, foregroundColor: String) in
        view.foregroundColorHex = foregroundColor
      }

      Prop("mutedForegroundColor") { (view: LancerTerminalView, mutedForegroundColor: String) in
        view.mutedForegroundColorHex = mutedForegroundColor
      }

      Prop("captureRequest") { (view: LancerTerminalView, request: Double) in
        view.captureRequest = request
      }

      Prop("sharedGrid") { (view: LancerTerminalView, sharedGrid: [Int]) in
        view.sharedGrid = sharedGrid
      }
      Events("onInput", "onResize", "onCapture")

      OnViewDidUpdateProps { (view: LancerTerminalView) in
        view.applyPendingBuffer()
      }
    }
  }
}
