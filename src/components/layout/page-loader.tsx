import { BrandLoader } from "@/components/ui/brand-loader";
import styles from "./page-loader.module.css";

// Hides the overlay once the page has loaded (min. 300ms visible), with a
// 1500ms safety net. Kept tiny and dependency-free on purpose.
const HIDE_SCRIPT = `(function(){var d=document,e=d.getElementById("page-loader"),t=Date.now(),x=0;function h(){if(x||!e)return;x=1;e.setAttribute("data-state","hiding");d.body.removeAttribute("aria-busy");setTimeout(function(){e.hidden=true},250)}function r(){setTimeout(h,Math.max(0,300-(Date.now()-t)))}d.readyState==="complete"?r():addEventListener("load",r);setTimeout(h,1500)})()`;

export function PageLoader() {
  return (
    <>
      <div
        id="page-loader"
        data-state="visible"
        className={styles.overlay}
        suppressHydrationWarning
      >
        <BrandLoader size={64} />
      </div>
      <script dangerouslySetInnerHTML={{ __html: HIDE_SCRIPT }} />
      <noscript>
        <style>{"#page-loader{display:none!important}"}</style>
      </noscript>
    </>
  );
}
