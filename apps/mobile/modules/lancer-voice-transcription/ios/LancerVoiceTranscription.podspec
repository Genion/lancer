Pod::Spec.new do |s|
  s.name = 'LancerVoiceTranscription'
  s.version = '1.0.0'
  s.summary = 'Local recording conversion for Lancer dictation.'
  s.author = 'Lancer contributors'
  s.homepage = 'https://github.com/raylee-ai/lancer'
  s.platform = :ios, '18.0'
  s.source = { :path => '.' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '*.swift'
  s.frameworks = 'AudioToolbox'
end
