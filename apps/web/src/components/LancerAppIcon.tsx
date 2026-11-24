// The production icon, as GitHub shows the T3 Code app, whatever this build's channel.
import appIconUrl from "./t3-github-app.png";

export function LancerAppIcon(props: { readonly className?: string }) {
  return <img src={appIconUrl} alt="" className={props.className} />;
}
