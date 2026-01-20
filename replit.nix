{pkgs}: {
  deps = [
    pkgs.libpng
    pkgs.libjpeg
    pkgs.giflib
    pkgs.pkg-config
    pkgs.pixman
    pkgs.pango
    pkgs.cairo
    pkgs.libuuid
    pkgs.imagemagick
    pkgs.jq
    pkgs.postgresql
  ];
}
