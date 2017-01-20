library(RColorBrewer)
library(grid)

fte_theme <- function (palate_color = "Greys") {
  
  #display.brewer.all(n=9,type="seq",exact.n=TRUE)
  palate <- brewer.pal(palate_color, n=9)
  color.background = palate[1]
  color.grid.minor = palate[3]
  color.grid.major = palate[3]
  color.axis.text = palate[6]
  color.axis.title = palate[7]
  color.title = palate[9]
  #color.title = "#2c3e50"
  
  font.title <- "Source Sans Pro"
  font.axis <- "Open Sans Condensed Bold"
  #font.axis <- "M+ 1m regular"
  #font.title <- "Arial"
  #font.axis <- "Arial"
  
  
  theme_bw(base_size=9) +
    # Set the entire chart region to a light gray color
    theme(panel.background=element_rect(fill=color.background, color=color.background)) +
    theme(plot.background=element_rect(fill=color.background, color=color.background)) +
    theme(panel.border=element_rect(color=color.background)) +
    # Format the grid
    theme(panel.grid.major=element_line(color=color.grid.major,size=.25)) +
    theme(panel.grid.minor=element_blank()) +
    #scale_x_continuous(minor_breaks=0,breaks=seq(0,100,10),limits=c(0,100)) +
    #scale_y_continuous(minor_breaks=0,breaks=seq(0,26,4),limits=c(0,25)) +
    theme(axis.ticks=element_blank()) +
    # Dispose of the legend
    theme(legend.position="none") +
    theme(legend.background = element_rect(fill=color.background)) +
    theme(legend.text = element_text(size=7,colour=color.axis.title,family=font.axis)) +
    # Set title and axis labels, and format these and tick marks
    theme(plot.title=element_text(colour=color.title,family=font.title, size=9, vjust=1.25, lineheight=0.1)) +
    #theme(plot.subtitle=element_text(colour=color.axis.text,family=font.title, size=6, vjust=1.25, lineheight=0.1)) +
    theme(axis.text.x=element_text(size=7,colour=color.axis.text,family=font.axis)) +
    theme(axis.text.y=element_text(size=7,colour=color.axis.text,family=font.axis)) +
    theme(axis.title.y=element_text(size=7,colour=color.axis.title,family=font.title, vjust=1.25)) +
    theme(axis.title.x=element_text(size=7,colour=color.axis.title,family=font.title, vjust=0)) +
    
    # Big bold line at y=0
    #geom_hline(yintercept=0,size=0.75,colour=palate[9]) +
    # Plot margins and finally line annotations
    theme(plot.margin = unit(c(0.35, 0.2, 0.15, 0.4), "cm")) +
    
    theme(strip.background = element_rect(fill=color.background, 
                                          color=color.background),
          strip.text=element_text(size=7,colour=color.axis.title,
                                  family=font.title)
          )
  
}