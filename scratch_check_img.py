from PIL import Image

cd_img = Image.open(r"c:\Users\user\MBP\muski-birthday\MuskiVERSE Countdown Chaos.png")
adv_img = Image.open(r"c:\Users\user\MBP\muski-birthday\MUSKI Adventures_ Whimsical Game World.png")

print(f"Countdown img size: {cd_img.size}")
print(f"Adventures img size: {adv_img.size}")
