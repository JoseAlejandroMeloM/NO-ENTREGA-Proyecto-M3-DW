import { Link, type LinkProps } from 'react-router-dom';
import { buttonClass, type ButtonSize, type ButtonVariant } from './buttonStyles';

interface Props extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** A navigation link that looks like a Button (e.g. "New product" in a page header). */
export default function ButtonLink({ variant = 'primary', size = 'md', className = '', ...rest }: Props) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}
