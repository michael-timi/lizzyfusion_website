import Link from "next/link";
import { LfRemoteImage } from "@/components/ui/lf-remote-image";
import { landingMedia } from "@/lib/site";

const [left, right] = landingMedia.collectionTiles;

/** Full-bleed dual lifestyle strip (Shop all reference). Each panel opens its representative PDP. */
export function ShopHeroDual() {
  return (
    <div className="grid grid-cols-2 gap-0">
      <Link href={left.href} className="group/hero relative block aspect-[3/2] min-h-[14rem] sm:min-h-[18rem] lg:min-h-[22rem]">
        <LfRemoteImage
          src={left.image}
          alt={left.label}
          fill
          className="object-cover transition duration-500 group-hover/hero:scale-[1.02]"
          sizes="50vw"
          priority
        />
      </Link>
      <Link href={right.href} className="group/hero relative block aspect-[3/2] min-h-[14rem] sm:min-h-[18rem] lg:min-h-[22rem]">
        <LfRemoteImage
          src={right.image}
          alt={right.label}
          fill
          className="object-cover transition duration-500 group-hover/hero:scale-[1.02]"
          sizes="50vw"
          priority
        />
      </Link>
    </div>
  );
}
