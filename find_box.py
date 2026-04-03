from PIL import Image

def find_white_box(image_path):
    img = Image.open(image_path).convert('RGB')
    w, h = img.size
    
    # Search in the central area
    for y in range(h // 4, 3 * h // 4):
        for x in range(w // 4, 3 * w // 4):
            r, g, b = img.getpixel((x, y))
            # Check for white pixel
            if r > 245 and g > 245 and b > 245:
                # Potential top-left of the box
                x_start, y_start = x, y
                
                # Check width
                x_end = x_start
                while x_end < w and all(c > 245 for c in img.getpixel((x_end, y_start))):
                    x_end += 1
                
                # Check height
                y_end = y_start
                while y_end < h and all(c > 245 for c in img.getpixel((x_start, y_end))):
                    y_end += 1
                
                width = x_end - x_start
                height = y_end - y_start
                
                # Minimum size to be the QR box (e.g. 100px)
                if width > 100 and height > 100:
                    return x_start, y_start, width, height
    return None

if __name__ == "__main__":
    coords = find_white_box('C:/Users/projo/AppData/Local/Temp/input_file_0.png')
    if coords:
        print(f"X={coords[0]}, Y={coords[1]}, W={coords[2]}, H={coords[3]}")
    else:
        print("Box not found")
