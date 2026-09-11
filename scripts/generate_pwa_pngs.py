import zlib
import struct
import math
import os

def create_png(width, height, get_pixel_fn, filename):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # Filter byte 0 (None)
        for x in range(width):
            r, g, b, a = get_pixel_fn(x, y, width, height)
            raw_data.extend([int(r) & 0xFF, int(g) & 0xFF, int(b) & 0xFF, int(a) & 0xFF])

    def chunk(tag, data):
        c = bytearray(tag) + bytearray(data)
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack('>I', len(data)) + c + struct.pack('>I', crc)

    png = bytearray(b'\x89PNG\r\n\x1a\n')
    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png.extend(chunk(b'IHDR', ihdr_data))
    # IDAT
    compressed = zlib.compress(bytes(raw_data), 9)
    png.extend(chunk(b'IDAT', compressed))
    # IEND
    png.extend(chunk(b'IEND', b''))

    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'wb') as f:
        f.write(png)
    print(f"Generated {filename} ({width}x{height})")

def render_icon(x, y, w, h, is_maskable=False):
    # Normalized coordinates -1 to 1
    nx = (x / (w - 1)) * 2.0 - 1.0
    ny = (y / (h - 1)) * 2.0 - 1.0

    # Base gradient: #4f46e5 (79, 70, 229) to #312e81 (49, 46, 129)
    grad_t = ((nx + 1.0) * 0.5 + (ny + 1.0) * 0.5) * 0.5
    grad_t = max(0.0, min(1.0, grad_t))
    r_bg = 79 * (1 - grad_t) + 40 * grad_t
    g_bg = 70 * (1 - grad_t) + 38 * grad_t
    b_bg = 229 * (1 - grad_t) + 130 * grad_t

    if is_maskable:
        # Full bleed background for Android maskable icon
        alpha = 255
    else:
        # Squircle / rounded rect for standalone & iOS
        # Corner radius approx 22%
        corner_r = 0.22
        # Distance from squircle edge
        ax = abs(nx)
        ay = abs(ny)
        if ax > 1.0 - corner_r and ay > 1.0 - corner_r:
            dx = ax - (1.0 - corner_r)
            dy = ay - (1.0 - corner_r)
            dist = math.sqrt(dx * dx + dy * dy)
            if dist > corner_r:
                return (0, 0, 0, 0)
            elif dist > corner_r - 0.02:
                # Anti-aliasing
                alpha = int(255 * (corner_r - dist) / 0.02)
            else:
                alpha = 255
        elif ax > 1.0 or ay > 1.0:
            return (0, 0, 0, 0)
        else:
            alpha = 255

    # Safe scale for maskable (inner 70% safe zone) vs normal (80%)
    scale = 0.65 if is_maskable else 0.78
    sx = nx / scale
    sy = ny / scale

    # Draw folder & lightning bolt inside central zone
    # Folder body: sx in [-0.65, 0.65], sy in [-0.45, 0.55]
    in_folder = (-0.65 <= sx <= 0.65) and (-0.45 <= sy <= 0.55)
    in_folder_tab = (-0.65 <= sx <= -0.15) and (-0.65 <= sy <= -0.45)
    
    # Lighting bolt: points around center
    # (0.1, -0.3) -> (-0.15, 0.05) -> (0.02, 0.05) -> (-0.08, 0.45) -> (0.22, 0.0) -> (0.05, 0.0) -> (0.1, -0.3)
    in_bolt = False
    # Approximate lightning bolt with two triangle / quad sections
    if -0.25 <= sx <= 0.35 and -0.35 <= sy <= 0.45:
        # Top segment
        if -0.35 <= sy <= 0.05:
            left_bound = -0.15 + (sy - 0.05) * (-0.25 / -0.4)
            right_bound = 0.12 + (sy - 0.05) * (-0.02 / -0.4)
            if left_bound <= sx <= right_bound + 0.1:
                in_bolt = True
        # Bottom segment
        if 0.0 <= sy <= 0.45:
            left_bound = -0.10 + (sy - 0.0) * (0.02 / 0.45)
            right_bound = 0.22 - (sy - 0.0) * (0.30 / 0.45)
            if left_bound <= sx <= right_bound:
                in_bolt = True

    if in_bolt:
        # Cyan-blue to indigo lightning bolt: #38bdf8 (56, 189, 248) -> #ffffff
        return (255, 255, 255, alpha)
    elif in_folder or in_folder_tab:
        # Folder flap: translucent indigo/slate glass
        f_alpha = 0.35
        r_f = int(r_bg * (1 - f_alpha) + 165 * f_alpha)
        g_f = int(g_bg * (1 - f_alpha) + 180 * f_alpha)
        b_f = int(b_bg * (1 - f_alpha) + 252 * f_alpha)
        return (r_f, g_f, b_f, alpha)
    else:
        # Outer border accent
        if not is_maskable and (abs(nx) > 0.94 or abs(ny) > 0.94):
            return (min(255, int(r_bg + 40)), min(255, int(g_bg + 40)), min(255, int(b_bg + 40)), alpha)
        return (int(r_bg), int(g_bg), int(b_bg), alpha)

if __name__ == '__main__':
    create_png(192, 192, lambda x, y, w, h: render_icon(x, y, w, h, False), 'public/pwa-192x192.png')
    create_png(512, 512, lambda x, y, w, h: render_icon(x, y, w, h, False), 'public/pwa-512x512.png')
    create_png(512, 512, lambda x, y, w, h: render_icon(x, y, w, h, True), 'public/pwa-maskable-512x512.png')
    create_png(180, 180, lambda x, y, w, h: render_icon(x, y, w, h, False), 'public/apple-touch-icon.png')
    print("PWA icons successfully generated!")
