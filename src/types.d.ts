declare module 'aspect-fit' {
  function fit(srcWidth: number, srcHeight: number, dstWidth: number, dstHeight: number): {
    width: number
    height: number
    scale: number
  }
  export default fit
}
