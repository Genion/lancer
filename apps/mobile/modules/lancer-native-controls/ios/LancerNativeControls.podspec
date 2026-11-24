Pod::Spec.new do |s|
  s.name           = 'LancerNativeControls'
  s.version        = '1.0.0'
  s.summary        = 'Native UIKit controls for Lancer mobile.'
  s.description    = 'UIKit-backed controls that match native iOS navigation chrome.'
  s.author         = 'Lancer contributors'
  s.homepage       = 'https://github.com/raylee-ai/lancer'
  s.platforms      = {
    :ios => '18.0',
  }
  s.source         = { :path => '.' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }
  s.resource_bundles = { 'LancerNativeControlIcons' => ['Resources/Icons/pull-request*.png'] }
  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
