import {
  EffectPass,
  ScanlineEffect,
  GlitchEffect,
  HueSaturationEffect,
  ColorDepthEffect,
  MaskPass,
  ClearPass,
  BlurPass,
  KernelSize,
  ClearMaskPass,
  Effect,
  SavePass,
  TextureEffect,
  BlendFunction,
  BlendMode,
} from 'postprocessing';

import {
  Mesh,
  MeshBasicMaterial,
  Color,
  Texture,
  Group,
  TextureLoader,
  CircleBufferGeometry,
} from 'three';
import { renderPass, webcamEffect, orthCam } from '../setup';

import { faceGeometry, metrics, trackFace } from '../faceMesh';
import { ColorOverlayEffect } from '../effects/ColorOverlayEffect';
import { SmokeEffect } from '../effects/SmokeEffect';
import { camTexture } from '../webcam';
import { FaceDetailEffect } from '../effects/FaceDetailEffect';

import eyesUrl from '../assets/eyes_inverted.jpg';

const whiteMat = new MeshBasicMaterial({
  color: 0xffffff,
});

const eyesTex = new TextureLoader().load(eyesUrl);
const mat = new MeshBasicMaterial({
  map: eyesTex,
});

export class Smoke {
  constructor({ composer, scene }) {
    this.trackGroup = new Group();
    scene.add(this.trackGroup);

    /* Mask mesh */
    const mesh = new Mesh(faceGeometry, mat);
    const mouthPlane = new CircleBufferGeometry(100, 16);

    const mouthMesh = new Mesh(mouthPlane, whiteMat);
    mouthMesh.scale.set(1, 0.5, 1);
    mouthMesh.position.set(0, -100, -50);

    this.trackGroup.add(mouthMesh);
    scene.add(mesh);

    scene.background = new Color(0x000000);

    const camPass = new EffectPass(null, webcamEffect);

    const saveShiftPass = new SavePass();

    const saveAllPass = new SavePass();

    const smokeEffect = new SmokeEffect({
      prevFrameTex: saveShiftPass.renderTarget.texture,
    });

    const shiftEffectPass = new EffectPass(null, smokeEffect);

    const smokeTexEffect = new TextureEffect({
      texture: saveShiftPass.renderTarget.texture,
      blendFunction: BlendFunction.ALPHA,
    });

    const overlayShiftPass = new EffectPass(null, webcamEffect, smokeTexEffect);

    const blurPass = new BlurPass({
      KernelSize: KernelSize.SMALL,
    });
    blurPass.scale = 0.01;

    composer.addPass(renderPass);

    composer.addPass(shiftEffectPass);
    composer.addPass(blurPass);

    composer.addPass(saveShiftPass);
    composer.addPass(overlayShiftPass);
  }

  update() {
    trackFace(this.trackGroup);
  }
}
