import styles from './IdleOverlay.module.css';

interface Props {
  onContinue: () => void;
}

export default function IdleOverlay({ onContinue }: Props) {
  return (
    <div className={styles.overlay}>
      <h2 className={styles.title}>Are you still listening?<br/>Music recognition paused to save energy.</h2>
      <button className={styles.button} onClick={onContinue}>
        Continue Listening
      </button>
    </div>
  );
}
