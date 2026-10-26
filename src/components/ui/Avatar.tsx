import { Icon } from './Icon';

const COLORS = ['#e17076', '#faa774', '#a695e7', '#7bc862', '#6ec9cb', '#65aadd', '#ee7aae'];

function hash(value: string) {
  let result = 0;
  for (let i = 0; i < value.length; i++) result = (result * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(result);
}

function initials(name: string) {
  const words = name.split(/\s+/).filter((word) => /\p{L}/u.test(word));
  return words
    .slice(0, 2)
    .map((word) => word.match(/\p{L}/u)![0].toUpperCase())
    .join('');
}

interface AvatarProps {
  id: string;
  name: string;
  size?: number;
}

export function Avatar({ id, name, size = 54 }: AvatarProps) {
  const letters = initials(name);
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.38, background: COLORS[hash(id) % COLORS.length] }}
      aria-hidden="true"
    >
      {letters || <Icon name="person" size={size * 0.6} />}
    </div>
  );
}
