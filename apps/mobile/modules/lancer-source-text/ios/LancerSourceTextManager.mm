#import <React/RCTUIManager.h>
#import <React/RCTViewManager.h>

@interface LancerSourceTextManager : RCTViewManager
@end

@implementation LancerSourceTextManager

RCT_EXPORT_MODULE(LancerSourceText)

- (UIView *)view {
  return [[UIView alloc] init];
}

@end

@interface LancerSourceTextRunManager : RCTViewManager
@end

@implementation LancerSourceTextRunManager

RCT_EXPORT_MODULE(LancerSourceTextRun)

- (UIView *)view {
  return nil;
}

@end
