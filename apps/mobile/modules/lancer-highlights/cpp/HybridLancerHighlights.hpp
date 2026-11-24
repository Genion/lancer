#pragma once

#include "HybridLancerHighlightsSpec.hpp"

namespace margelo::nitro::lancerhighlights {

class HybridLancerHighlights : public HybridLancerHighlightsSpec {
public:
  HybridLancerHighlights() : HybridObject(TAG) {}

  std::optional<std::shared_ptr<ArrayBuffer>> tokenize(SourceText source,
                                                       double language) override;
};

} // namespace margelo::nitro::lancerhighlights
