/**
 * coords-adapter.js
 * 
 * Жёсткий адаптер для преобразования воксельных координат в Three.js
 * 
 * Воксельная система: X (вправо), Y (вперёд), Z (вверх)
 * Three.js система:   X (вправо), Y (вверх), Z (на камеру)
 * 
 * Трансформация: 3D_X = X, 3D_Y = Z, 3D_Z = -Y
 */

(function (g) {
  'use strict';
  const isNode = typeof module === 'object' && module.exports;

  /**
   * Преобразует вокселевую позицию в Three.js координаты
   * @param {number} vx - воксель X (вправо)
   * @param {number} vy - воксель Y (вперёд)
   * @param {number} vz - воксель Z (вверх)
   * @returns {Object} { x, y, z } для Three.js
   */
  function voxelToThree(vx, vy, vz) {
    return {
      x: vx,
      y: vz,
      z: -vy
    };
  }

  /**
   * Преобразует Three.js координаты обратно в вокселевые
   * @param {number} x3d - Three.js X
   * @param {number} y3d - Three.js Y
   * @param {number} z3d - Three.js Z
   * @returns {Object} { x, y, z } для вокселей
   */
  function threeToVoxel(x3d, y3d, z3d) {
    return {
      x: x3d,
      y: -z3d,
      z: y3d
    };
  }

  /**
   * Преобразует вектор направления из вокселевой системы в Three.js
   * @param {number} vx - вокселевое направление X
   * @param {number} vy - вокселевое направление Y
   * @param {number} vz - вокселевое направление Z
   * @returns {Object} { x, y, z } направление в Three.js
   */
  function voxelDirToThree(vx, vy, vz) {
    return {
      x: vx,
      y: vz,
      z: -vy
    };
  }

  /**
   * Преобразует квадратурный вектор (напр. при орбитальной камере)
   * используется для правильного расчёта поворотов
   * @param {number} dx - дельта X воксель
   * @param {number} dy - дельта Y воксель
   * @param {number} dz - дельта Z воксель
   * @returns {Object} { x, y, z } дельта в Three.js
   */
  function voxelDeltaToThree(dx, dy, dz) {
    return {
      x: dx,
      y: dz,
      z: -dy
    };
  }

  /**
   * Преобразует Vector3 или объект { x, y, z } из вокселей в Three.js
   * @param {Object|THREE.Vector3} v - воксельный вектор
   * @returns {Object} { x, y, z } для Three.js
   */
  function transformVoxelVector(v) {
    if (v.x !== undefined) {
      return voxelToThree(v.x, v.y, v.z);
    }
    return { x: 0, y: 0, z: 0 };
  }

  /**
   * Применяет преобразование к объекту Three.js
   * @param {THREE.Object3D} obj - объект (Mesh, Group, etc.)
   * @param {number} vx - воксель X
   * @param {number} vy - воксель Y
   * @param {number} vz - воксель Z
   */
  function applyVoxelPosition(obj, vx, vy, vz) {
    if (!obj || !obj.position) return;
    const pos = voxelToThree(vx, vy, vz);
    obj.position.set(pos.x, pos.y, pos.z);
  }

  /**
   * Применяет масштабирование (масштаб одинаков по всем осям, поэтому преобразование не нужно)
   * @param {THREE.Object3D} obj
   * @param {number} scale
   */
  function applyVoxelScale(obj, scale) {
    if (!obj || !obj.scale) return;
    obj.scale.set(scale, scale, scale);
  }

  /**
   * Преобразует направление взгляда для камеры
   * dir = 0,1,2,3 -> 0°, 90°, 180°, 270°
   * @param {number} dir - направление (0-3)
   * @returns {number} радианы поворота вокруг Y оси в Three.js
   */
  function dirToYawRadians(dir) {
    // 0 = юг (лицом к камере) = 0 радиан
    // 1 = запад (влево) = π/2 радиан
    // 2 = север (спиной) = π радиан
    // 3 = восток (вправо) = 3π/2 радиан
    return (dir * Math.PI / 2);
  }

  /**
   * Обратное преобразование: радианы в направление
   * @param {number} radians - угол в радианах вокруг Y оси
   * @returns {number} направление (0-3)
   */
  function radiansToDir(radians) {
    const normalized = ((radians / (Math.PI / 2)) + 4) % 4;
    return Math.round(normalized) & 3;
  }

  const api = {
    voxelToThree,
    threeToVoxel,
    voxelDirToThree,
    voxelDeltaToThree,
    transformVoxelVector,
    applyVoxelPosition,
    applyVoxelScale,
    dirToYawRadians,
    radiansToDir,
    // Констанста для документации
    VOXEL_AXES: { x: 'right', y: 'forward', z: 'up' },
    THREE_AXES: { x: 'right', y: 'up', z: 'toward-camera' }
  };

  if (isNode) module.exports = api;
  else g.CoordsAdapter = api;
})(typeof self !== 'undefined' ? self : globalThis);
