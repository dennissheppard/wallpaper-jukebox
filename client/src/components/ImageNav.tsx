import styles from './ImageNav.module.css';

interface Props {
  onNext: () => void;
}

function ImageNav({ onNext }: Props) {
  return (
    <div className={styles.hoverZone}>
      <button
        className={styles.navButton}
        onClick={onNext}
        title="Next Image"
      >
        <span className={styles.arrow}>&rarr;</span>
      </button>
    </div>
  );
}

export default ImageNav;
