import styles from './ExploringToast.module.css';

interface Props {
  theme: string;
}

function ExploringToast({ theme }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.toast}>
        <span className={styles.icon}>&#10024;</span>
        <div className={styles.content}>
          <span className={styles.label}>Exploring new themes</span>
          <span className={styles.theme}>{theme}</span>
        </div>
      </div>
    </div>
  );
}

export default ExploringToast;
