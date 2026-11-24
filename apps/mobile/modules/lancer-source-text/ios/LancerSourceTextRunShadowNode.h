#pragma once

#include <react/renderer/components/LancerSourceTextSpec/EventEmitters.h>
#include <react/renderer/components/LancerSourceTextSpec/Props.h>
#include <react/renderer/components/LancerSourceTextSpec/States.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook::react {
extern const char LancerSourceTextRunComponentName[];

using LancerSourceTextRunShadowNode =
    ConcreteViewShadowNode<LancerSourceTextRunComponentName, LancerSourceTextRunProps,
                           LancerSourceTextRunEventEmitter, LancerSourceTextRunState>;
} // namespace facebook::react
