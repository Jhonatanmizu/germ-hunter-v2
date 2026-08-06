import { Assets, type Texture } from 'pixi.js';
import characterUrl from './assets/character.png';

let characterTexture: Texture | null = null;

export async function loadAssets(): Promise<void> {
  characterTexture = await Assets.load<Texture>(characterUrl);
}

export function getCharacterTexture(): Texture {
  if (!characterTexture) {
    throw new Error('Assets ainda não carregados');
  }
  return characterTexture;
}
