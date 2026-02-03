import styles from './SaveButton.module.css';

interface Props {
  onSave: () => void;
}

function SaveButton({ onSave }: Props) {
  return (
    <button
      className={styles.saveButton}
      onClick={onSave}
      title="Save Screenshot"
    >
      <span className={styles.icon}>&#8595;</span>
    </button>
  );
}

export default SaveButton;
