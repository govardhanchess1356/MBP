import os
from PIL import Image

os.makedirs(r"c:\Users\user\MBP\muski-birthday\public\images\avatars", exist_ok=True)

cd_img = Image.open(r"c:\Users\user\MBP\muski-birthday\MuskiVERSE Countdown Chaos.png")
adv_img = Image.open(r"c:\Users\user\MBP\muski-birthday\MUSKI Adventures_ Whimsical Game World.png")

# Let's save a grid or slices to find exact coordinates
# Countdown image: 1671 x 941
# Let's crop:
# 1. Left character (around x=150..550, y=150..600)
# 2. Center character (around x=650..1050, y=100..550)
# 3. Right character (around x=1150..1550, y=150..600)

crops = {
    "cd_left": (200, 150, 600, 550),
    "cd_center": (650, 120, 1050, 520),
    "cd_right": (1100, 150, 1500, 550),
    "adv_left": (200, 200, 650, 650),
    "adv_center_panda": (680, 250, 1000, 570),
    "adv_right": (1050, 200, 1500, 650),
}

for name, box in crops.items():
    img = adv_img if name.startswith("adv") else cd_img
    c = img.crop(box)
    c.save(rf"c:\Users\user\MBP\muski-birthday\public\images\avatars\{name}.png")

print("Crops saved successfully!")
