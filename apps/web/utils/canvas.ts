import { Shape } from "../@types/shapeStore"

export function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  transform: { scale: number; offsetX: number; offsetY: number }
) {
  const { scale, offsetX, offsetY } = transform
  ctx.save()
  ctx.scale(scale, scale)
  ctx.translate(offsetX, offsetY)

  ctx.strokeStyle = shape.strokeColor
  ctx.lineWidth = shape.strokeWidth
  ctx.fillStyle = shape.fillColor

  switch (shape.type) {
    case "rect":
      ctx.beginPath()
      ctx.rect(shape.x, shape.y, shape.width, shape.height)
      ctx.fill()
      ctx.stroke()
      break

    case "circle":
      ctx.beginPath()
      ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      break

    case "line":
      ctx.beginPath()
      ctx.moveTo(shape.x1, shape.y1)
      ctx.lineTo(shape.x2, shape.y2)
      ctx.stroke()
      break

    case "text":
      ctx.font = `${shape.fontSize}px sans-serif`
      ctx.fillStyle = shape.strokeColor
      ctx.fillText(shape.content, shape.x, shape.y)
      break

    case "draw":
      if (shape.points && shape.points.length > 0) {
        console.log(shape,"shape in canvas.ts");
        
        ctx.beginPath()
        ctx.moveTo(shape.points[0].x, shape.points[0].y)
        shape.points.forEach((point) => {
          ctx.lineTo(point.x, point.y)
        })
        ctx.stroke()
      }
      break

    case "arrow":
      const angle = Math.atan2(shape.y2 - shape.y1, shape.x2 - shape.x1)
      const arrowLength = 15

      ctx.beginPath()
      ctx.moveTo(shape.x1, shape.y1)
      ctx.lineTo(shape.x2, shape.y2)

      ctx.lineTo(
        shape.x2 - arrowLength * Math.cos(angle - Math.PI / 6),
        shape.y2 - arrowLength * Math.sin(angle - Math.PI / 6)
      )
      ctx.moveTo(shape.x2, shape.y2)
      ctx.lineTo(
        shape.x2 - arrowLength * Math.cos(angle + Math.PI / 6),
        shape.y2 - arrowLength * Math.sin(angle + Math.PI / 6)
      )
      ctx.stroke()
      break

    case "diamond":
      ctx.beginPath()
      ctx.moveTo(shape.x, shape.y - shape.height / 2)
      ctx.lineTo(shape.x + shape.width / 2, shape.y)
      ctx.lineTo(shape.x, shape.y + shape.height / 2)
      ctx.lineTo(shape.x - shape.width / 2, shape.y)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      break
  }

  ctx.restore()
}

export function isPointInShape(
  x: number,
  y: number,
  shape: Shape,
  transform: { scale: number; offsetX: number; offsetY: number }
): boolean {
  const { scale, offsetX, offsetY } = transform
  const tx = (x - offsetX) / scale
  const ty = (y - offsetY) / scale

  switch (shape.type) {
    case "rect":
      return (
        tx >= shape.x &&
        tx <= shape.x + shape.width &&
        ty >= shape.y &&
        ty <= shape.y + shape.height
      )

    case "circle":
      const dx = tx - shape.x
      const dy = ty - shape.y
      return Math.sqrt(dx * dx + dy * dy) <= shape.radius

    case "line":
    case "arrow":
      const threshold = 5
      const A = { x: shape.x1, y: shape.y1 }
      const B = { x: shape.x2, y: shape.y2 }
      const C = { x: tx, y: ty }
      return pointToLineDistance(A, B, C) <= threshold

    case "text":
      // Simplified text hit detection
      return (
        tx >= shape.x &&
        tx <= shape.x + 100 && // Approximate text width
        ty >= shape.y - shape.fontSize &&
        ty <= shape.y
      )

    case "diamond":
      // Simplified diamond hit detection
      return (
        tx >= shape.x - shape.width / 2 &&
        tx <= shape.x + shape.width / 2 &&
        ty >= shape.y - shape.height / 2 &&
        ty <= shape.y + shape.height / 2
      )

    default:
      return false
  }
}

function pointToLineDistance(
  A: { x: number; y: number },
  B: { x: number; y: number },
  C: { x: number; y: number }
) {
  const numerator = Math.abs(
    (B.y - A.y) * C.x - (B.x - A.x) * C.y + B.x * A.y - B.y * A.x
  )
  const denominator = Math.sqrt(Math.pow(B.y - A.y, 2) + Math.pow(B.x - A.x, 2))
  return numerator / denominator
}

