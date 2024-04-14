import subprocess
import torch
import torch.nn.functional as F
from torchvision import transforms

import PIL
from PIL import Image
import numpy as np
import matplotlib.pyplot as plt

import argparse
import os.path
from pathlib import Path
import glob
import sys

import pdb

from .modules.unet import UNet
from .modules.midas.dpt_depth import DPTDepthModel
from .data.transforms import get_transform


parser = argparse.ArgumentParser(description='Visualize output for depth or surface normals')

parser.add_argument('--task', dest='task', help="normal or depth")
parser.set_defaults(task='NONE')

parser.add_argument('--img_path', dest='img_path', help="path to rgb image")
parser.set_defaults(im_name='NONE')

parser.add_argument('--output_path', dest='output_path', help="path to where output image should be stored")
parser.set_defaults(store_name='NONE')

args = parser.parse_args()

root_dir = '../pretrained_models/'

trans_topil = transforms.ToPILImage()

os.system(f"mkdir -p {args.output_path}")
map_location = (lambda storage, loc: storage.cuda()) if torch.cuda.is_available() else torch.device('cpu')
device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')

def get_normal_map(task, img):
    # raw_input = img
    # x, y = img.size
    # ratio = min(x/384, y/384)
    # resized_input = img.resize((int(x*ratio), int(y*ratio)))
    # fill_color = raw_input.getpixel((0, 0)) # set fill color to be the same as input's top left pixel
    # img = Image.new('RGBA', (384, 384), fill_color)
    # img.paste(resized_input, (int((384 - x) / 2), int((384 - y) / 2)))
    # img.show()

    raw_input = img
    x, y = img.size
    padded_size = max(x, y)
    fill_color = raw_input.getpixel((0, 0)) # set fill color to be the same as input's top left pixel
    img = Image.new('RGBA', (padded_size, padded_size), fill_color)
    img.paste(raw_input, (int((padded_size - x) / 2), int((padded_size - y) / 2)))
    img = img.resize((384, 384))
    img.show()

    # get target task and model
    if task == 'normal':
        image_size = 384
        
        ## Version 1 model
        # pretrained_weights_path = root_dir + 'omnidata_unet_normal_v1.pth'
        # model = UNet(in_channels=3, out_channels=3)
        # checkpoint = torch.load(pretrained_weights_path, map_location=map_location)

        # if 'state_dict' in checkpoint:
        #     state_dict = {}
        #     for k, v in checkpoint['state_dict'].items():
        #         state_dict[k.replace('model.', '')] = v
        # else:
        #     state_dict = checkpoint
        # subprocess.call(["ls", "-l"])
        # pretrained_weights_path = root_dir + 'omnidata_dpt_normal_v2.ckpt'
        pretrained_weights_path = "C:\\Users\\ukzha\\Documents\\Course_Material\\CMPT461\\Project\\front_end\\2dPixelArt\\python\\omnidata_main\\omnidata_tools\\torch\\pretrained_models\\omnidata_dpt_normal_v2.ckpt"
        model = DPTDepthModel(backbone='vitb_rn50_384', num_channels=3) # DPT Hybrid
        checkpoint = torch.load(pretrained_weights_path, map_location=map_location)
        if 'state_dict' in checkpoint:
            state_dict = {}
            for k, v in checkpoint['state_dict'].items():
                state_dict[k[6:]] = v
        else:
            state_dict = checkpoint

        model.load_state_dict(state_dict)
        model.to(device)
        trans_totensor = transforms.Compose([transforms.Resize(image_size, interpolation=PIL.Image.BILINEAR),
                                             # transforms.CenterCrop(image_size),
                                             get_transform('rgb', image_size=None)])

    elif args.task == 'depth':
        # image_size = 384
        pretrained_weights_path = root_dir + 'omnidata_dpt_depth_v2.ckpt'  # 'omnidata_dpt_depth_v1.ckpt'
        # model = DPTDepthModel(backbone='vitl16_384') # DPT Large
        model = DPTDepthModel(backbone='vitb_rn50_384') # DPT Hybrid
        checkpoint = torch.load(pretrained_weights_path, map_location=map_location)
        if 'state_dict' in checkpoint:
            state_dict = {}
            for k, v in checkpoint['state_dict'].items():
                state_dict[k[6:]] = v
        else:
            state_dict = checkpoint
        model.load_state_dict(state_dict)
        model.to(device)
        trans_totensor = transforms.Compose([transforms.Resize(image_size, interpolation=PIL.Image.BILINEAR),
                                            transforms.CenterCrop(image_size),
                                            transforms.ToTensor(),
                                            transforms.Normalize(mean=0.5, std=0.5)])

    else:
        print("task should be one of the following: normal, depth")
        sys.exit()

    trans_rgb = transforms.Compose([transforms.Resize(512, interpolation=PIL.Image.BILINEAR),
                                    transforms.CenterCrop(512)])


    def standardize_depth_map(img, mask_valid=None, trunc_value=0.1):
        if mask_valid is not None:
            img[~mask_valid] = torch.nan
        sorted_img = torch.sort(torch.flatten(img))[0]
        # Remove nan, nan at the end of sort
        num_nan = sorted_img.isnan().sum()
        if num_nan > 0:
            sorted_img = sorted_img[:-num_nan]
        # Remove outliers
        trunc_img = sorted_img[int(trunc_value * len(sorted_img)): int((1 - trunc_value) * len(sorted_img))]
        trunc_mean = trunc_img.mean()
        trunc_var = trunc_img.var()
        eps = 1e-6
        # Replace nan by mean
        img = torch.nan_to_num(img, nan=trunc_mean)
        # Standardize
        img = (img - trunc_mean) / torch.sqrt(trunc_var + eps)
        return img


    def save_outputs(img):
        with torch.no_grad():
            img_tensor = trans_totensor(img)[:3].unsqueeze(0).to(device)

            # rgb_path = os.path.join(args.output_path, f'{output_file_name}_rgb.png')
            # trans_rgb(img).save(rgb_path)

            if img_tensor.shape[1] == 1:
                img_tensor = img_tensor.repeat_interleave(3,1)

            output = model(img_tensor).clamp(min=0, max=1)
            # plt.imsave("output.jpg", output.detach().cpu().squeeze(),cmap='viridis')
            trans_topil(output[0]).save("output.jpg")

            if args.task == 'depth':
                output = F.interpolate(output.unsqueeze(0), (512, 512), mode='bicubic').squeeze(0)
                output = output.clamp(0,1)
                output = 1 - output
                output = standardize_depth_map(output)
                plt.imsave("output.jpg", output.detach().cpu().squeeze(),cmap='viridis')

        return output.detach().cpu().squeeze()

    return save_outputs(img)