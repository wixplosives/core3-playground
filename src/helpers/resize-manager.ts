// import cssUtils from "../components/utils.module.css";

// export interface Sizes {
//   top?: string;
//   left?: string;
//   right?: string;
//   bottom?: string;
// }
// export type Mode = "px" | "%";

// export class GridResizeManager {
//   constructor(private root: HTMLElement, private sizes: Sizes = {}, private mode: Mode = "%") {}

//   public setSizes() {
//     const { root, sizes } = this;
//     sizes.top && root.style.setProperty("--x-top", sizes.top);
//     sizes.left && root.style.setProperty("--x-left", sizes.left);
//     sizes.right && root.style.setProperty("--x-right", sizes.right);
//     sizes.bottom && root.style.setProperty("--x-bottom", sizes.bottom);
//     return this;
//   }

//   public bindEvents() {
//     this.root.addEventListener("mousedown", this.handleMouseDown);
//     return () => {
//       this.root.removeEventListener("mousedown", this.handleMouseDown);
//     };
//   }

//   private handleMouseDown = (e: MouseEvent) => {
//     const divider = e.target as HTMLElement;
//     if (!divider.classList.contains(styles["divider"]!)) {
//       return;
//     }
//     const panel = divider.previousElementSibling as HTMLElement;
//     const { root, sizes } = this;
//     const { clientX: x, clientY: y } = e;
//     const { width: dw, height: dh } = divider.getBoundingClientRect();
//     const { width: w, height: h } = this.root.getBoundingClientRect();
//     const { width, height } = panel.getBoundingClientRect();
//     const dw2 = dw + dw;
//     const dh2 = dh + dh;
//     if (panel.classList.contains(styles["left"]!)) {
//       this.initDrag(({ clientX }) => {
//         sizes.left = this.getSize(width + (clientX - x), w, dw2);
//         root.style.setProperty("--x-left", sizes.left);
//       });
//     } else if (panel.classList.contains(styles["right"]!)) {
//       this.initDrag(({ clientX }) => {
//         sizes.right = this.getSize(width + (x - clientX), w, dw2);
//         root.style.setProperty("--x-right", sizes.right);
//       });
//     } else if (panel.classList.contains(styles["header"]!)) {
//       this.initDrag(({ clientY }) => {
//         sizes.top = this.getSize(height + (clientY - y), h, dh2);
//         root.style.setProperty("--x-top", sizes.top);
//       });
//     } else if (panel.classList.contains(styles["footer"]!)) {
//       this.initDrag(({ clientY }) => {
//         sizes.bottom = this.getSize(height + (y - clientY), h, dh2);
//         root.style.setProperty("--x-bottom", sizes.bottom);
//       });
//     }
//   };

//   private getSize(wanted: number, max: number, keep: number) {
//     if (this.mode === "px") {
//       const value = Math.min(max - keep, Math.max(0, wanted));
//       return `${value}${this.mode}`;
//     } else {
//       const value = Math.min(100 - (keep / max) * 100, Math.max(0, (wanted / max) * 100));
//       return `${value}${this.mode}`;
//     }
//   }

//   private initDrag(move: (e: MouseEvent) => void) {
//     this.root.classList.add(cssUtils["disableSelection"]!);
//     const up = () => {
//       this.root.classList.remove(cssUtils["disableSelection"]!);
//       window.removeEventListener("mousemove", move);
//       window.removeEventListener("mouseup", up);
//     };
//     window.addEventListener("mousemove", move);
//     window.addEventListener("mouseup", up);
//   }
// }
