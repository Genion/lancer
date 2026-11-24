#pragma once

#include "LancerSourceTextRunShadowNode.h"

#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {
using LancerSourceTextRunComponentDescriptor =
    ConcreteComponentDescriptor<LancerSourceTextRunShadowNode>;

void LancerSourceTextRunSpec_registerComponentDescriptorsFromCodegen(
    std::shared_ptr<const ComponentDescriptorProviderRegistry> registry);
} // namespace facebook::react
