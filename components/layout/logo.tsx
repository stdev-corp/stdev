import Image from 'next/image'
import Link from 'next/link'

type Props = {
  src: string
  url: string
}

export default function Logo(props: Props) {
  return (
    <Link href={props.url} passHref target="_blank">
      <div className="bg-white h-12 w-56 relative">
        <Image
          src={props.src}
          alt="logo"
          fill
          style={{
            objectFit: 'contain',
            objectPosition: 'left center',
          }}
        />
      </div>
    </Link>
  )
}
