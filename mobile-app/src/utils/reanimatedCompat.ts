/**
 * Compatibility shim for useAnimatedGestureHandler
 * Provides Reanimated 2 API compatibility for Reanimated 3
 */
import { Gesture } from 'react-native-gesture-handler';
import {
  runOnJS,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
} from 'react-native-reanimated';

export function useAnimatedGestureHandler<
  T extends { state: number; translationX: number; translationY: number; velocityX: number; velocityY: number; x: number; y: number },
  C extends Record<string, any>
>(
  handlers: {
    onStart?: (event: T, context: C) => void;
    onActive?: (event: T, context: C) => void;
    onEnd?: (event: T, context: C) => void;
    onFinish?: (event: T, context: C) => void;
    onCancel?: (event: T, context: C) => void;
    onFail?: (event: T, context: C) => void;
  }
) {
  const context = useSharedValue<C>({} as C);
  const gestureState = useSharedValue(0);
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const velocityX = useSharedValue(0);
  const velocityY = useSharedValue(0);
  const x = useSharedValue(0);
  const y = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart((event) => {
      gestureState.value = 1; // ACTIVE
      x.value = event.x;
      y.value = event.y;
      translationX.value = event.translationX;
      translationY.value = event.translationY;
      
      if (handlers.onStart) {
        const eventObj = {
          state: 1,
          translationX: event.translationX,
          translationY: event.translationY,
          velocityX: event.velocityX,
          velocityY: event.velocityY,
          x: event.x,
          y: event.y,
        } as T;
        handlers.onStart(eventObj, context.value);
      }
    })
    .onUpdate((event) => {
      gestureState.value = 2; // ACTIVE
      x.value = event.x;
      y.value = event.y;
      translationX.value = event.translationX;
      translationY.value = event.translationY;
      velocityX.value = event.velocityX;
      velocityY.value = event.velocityY;
      
      if (handlers.onActive) {
        const eventObj = {
          state: 2,
          translationX: event.translationX,
          translationY: event.translationY,
          velocityX: event.velocityX,
          velocityY: event.velocityY,
          x: event.x,
          y: event.y,
        } as T;
        handlers.onActive(eventObj, context.value);
      }
    })
    .onEnd((event) => {
      gestureState.value = 5; // END
      velocityX.value = event.velocityX;
      velocityY.value = event.velocityY;
      
      if (handlers.onEnd) {
        const eventObj = {
          state: 5,
          translationX: event.translationX,
          translationY: event.translationY,
          velocityX: event.velocityX,
          velocityY: event.velocityY,
          x: event.x,
          y: event.y,
        } as T;
        handlers.onEnd(eventObj, context.value);
      }
      
      if (handlers.onFinish) {
        const eventObj = {
          state: 5,
          translationX: event.translationX,
          translationY: event.translationY,
          velocityX: event.velocityX,
          velocityY: event.velocityY,
          x: event.x,
          y: event.y,
        } as T;
        handlers.onFinish(eventObj, context.value);
      }
    })
    .onCancel(() => {
      gestureState.value = 3; // CANCELLED
      if (handlers.onCancel) {
        const eventObj = {
          state: 3,
          translationX: translationX.value,
          translationY: translationY.value,
          velocityX: velocityX.value,
          velocityY: velocityY.value,
          x: x.value,
          y: y.value,
        } as T;
        handlers.onCancel(eventObj, context.value);
      }
    })
    .onFail(() => {
      gestureState.value = 4; // FAILED
      if (handlers.onFail) {
        const eventObj = {
          state: 4,
          translationX: translationX.value,
          translationY: translationY.value,
          velocityX: velocityX.value,
          velocityY: velocityY.value,
          x: x.value,
          y: y.value,
        } as T;
        handlers.onFail(eventObj, context.value);
      }
    });

  return panGesture;
}

