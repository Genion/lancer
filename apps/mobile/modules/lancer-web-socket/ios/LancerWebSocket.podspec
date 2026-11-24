Pod::Spec.new do |s|
  s.name = 'LancerWebSocket'
  s.version = '1.0.0'
  s.summary = 'WebSocket client with permessage-deflate for Lancer mobile.'
  s.description = 'React Native ships SocketRocket on iOS, which never negotiates compression. This module dials the T3 server through URLSessionWebSocketTask, which offers permessage-deflate on its own.'
  s.author = 'Lancer contributors'
  s.homepage = 'https://github.com/raylee-ai/lancer'
  s.platform = :ios, '18.0'
  s.source = { :path => '.' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '*.swift'
end
