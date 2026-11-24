#import "LancerSourceTextRun.h"
#import <React/RCTFabricComponentsPlugins.h>
#import "LancerSourceTextRunComponentDescriptor.h"
#import <react/renderer/components/LancerSourceTextSpec/Props.h>
#import <react/renderer/components/LancerSourceTextSpec/RCTComponentViewHelpers.h>

using namespace facebook::react;

@interface LancerSourceTextRun () <RCTLancerSourceTextRunViewProtocol>

@end

@implementation LancerSourceTextRun {
  NSString *_text;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<
      LancerSourceTextRunComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps =
        std::make_shared<const LancerSourceTextRunProps>();
    _props = defaultProps;
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props
           oldProps:(Props::Shared const &)oldProps {
  const auto &oldViewProps =
      *std::static_pointer_cast<LancerSourceTextRunProps const>(_props);
  const auto &newViewProps =
      *std::static_pointer_cast<LancerSourceTextRunProps const>(props);

  if (newViewProps.text != oldViewProps.text) {
    NSString *text = [NSString stringWithUTF8String:newViewProps.text.c_str()];
    _text = text;
  }

  [super updateProps:props oldProps:oldProps];
}

+ (BOOL)shouldBeRecycled {
  return NO;
}

Class<RCTComponentViewProtocol> LancerSourceTextRunCls(void) {
  return LancerSourceTextRun.class;
}

@end
